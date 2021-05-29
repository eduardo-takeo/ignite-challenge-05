import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
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
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className={styles.loadingContainer}>
        <h1>Carregando...</h1>
      </div>
    );
  }

  function calculateReadTime(): number {
    const { content } = post.data;
    const totalWords = content
      .reduce((acc, value) => [...acc, RichText.asText(value.body)], [])
      .join(' ')
      .split(/\s+/).length;

    const readTime = Math.ceil(totalWords / 200);

    return readTime;
  }

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
          <FiClock style={{ marginRight: '15px' }} />
          {calculateReadTime()} min
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
// - calculate reading time
