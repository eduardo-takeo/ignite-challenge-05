import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const accessToken =
    'MC5ZTEpQTnhBQUFDWUF3RGVh.Nn_vv73vv73vv70077-9bGBTE3_vv71e77-977-977-9U--_ve-_vS3vv70YaBfvv71VECM277-9Fw';
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function loadMorePosts(): Promise<any> {
    const response = await fetch(
      `${postsPagination.next_page}&access_token=${accessToken}`
    )
      .then(res => res.json())
      .then(data => data);

    const updatedPosts = [...posts, ...response.results];
    setPosts(updatedPosts);
    setNextPage(response.next_page);
  }

  return (
    <main className={commonStyles.content}>
      {posts.map(post => (
        <div key={post.uid} className={styles.post}>
          <Link href={`/post/${post.uid}`}>
            <a>{post.data.title}</a>
          </Link>
          <p>{post.data.subtitle}</p>
          <span>
            <FiCalendar style={{ marginRight: '10px' }} />
            {format(new Date(post.first_publication_date), 'd MMM yyyy', {
              locale: ptBR,
            })}
          </span>
          <span>
            <FiUser style={{ marginRight: '10px' }} />
            {post.data.author}
          </span>
        </div>
      ))}
      {nextPage && (
        <button
          type="button"
          onClick={loadMorePosts}
          className={styles.loadMoreButton}
        >
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { pageSize: 5, page: 1 }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: { postsPagination },
  };
};
