import { useCallback, useEffect, useState } from 'react';

export default function useApiData(path, initialState = []) {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
      const payload = await response.json();
      setData(payload);
    } catch (err) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load, setData };
}
