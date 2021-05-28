import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
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
    <main className={styles.articleContainer}>
      <img src={post.data.banner.url} alt="Banner" />
      <article className={`${commonStyles.content} ${styles.articleContent}`}>
        <h1>{post.data.title}</h1>
        <span>
          <FiCalendar style={{ marginRight: '15px' }} />
          {format(new Date(post.first_publication_date), 'd MMM yyyy', {
            locale: ptBR,
          })}
        </span>
        <span>
          <FiUser style={{ marginRight: '15px' }} />
          {post.data.author}
        </span>
        <span>
          <FiClock style={{ marginRight: '15px' }} />4 min
        </span>
        {post?.data.content.map(section => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
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

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: { post },
  };
};

// TODO:
// - display loader on fallback
// - calculate reading time
