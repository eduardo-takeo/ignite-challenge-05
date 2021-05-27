import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  return (
    <main>
      <article>
        {post?.data.content.map(section => (
          <section key={section.heading}>
            <h1>{section.heading}</h1>
            {section.body.map(bodySection => (
              <p key={bodySection.text}>{bodySection.text}</p>
            ))}
          </section>
        ))}
      </article>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { pageSize: 5, page: 1 }
  );

  const postsUids = posts.results.map(post => post.uid);
  const paths = postsUids.map(uid => {
    return {
      params: {
        slug: uid,
      },
    };
  });

  // TODO
  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const content = response.data.content.map(section => {
    return {
      heading: section.heading,
      body: section.body.map(subsection => {
        return {
          text: subsection.text,
        };
      }),
    };
  });

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      "d 'de' MMM yyyy",
      { locale: ptBR }
    ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content,
    },
  };

  // TODO
  return {
    props: { post },
  };
};
