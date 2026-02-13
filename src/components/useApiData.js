import { useEffect, useState } from 'react';

export default function useApiData(path, initialState = []) {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
        const payload = await response.json();
        if (!ignore) setData(payload);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [path]);

  return { data, loading, error };
}
