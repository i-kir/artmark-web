import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorState, Loading } from '../components/StateMessage';
import NotFound from './NotFound';
import { useAuth } from '../contexts/AuthContext';
import { useCreateExhibition, useExhibitions, useMuseums, useUpdateExhibition } from '../hooks/queries';
import type { ExhibitionInput } from '../api/exhibitionsAdmin';
import { extractExhibition, type Extracted } from '../api/extract';

const GENRES = ['西洋画', '日本画', '現代アート', '写真', '彫刻', 'インスタレーション', 'デザイン', '映像'];

const EMPTY: ExhibitionInput = {
  museumId: '',
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  price: '',
  imageUrl: null,
  officialUrl: null,
  genre: [],
};

export default function ExhibitionEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { userId } = useAuth();

  const museums = useMuseums();
  const exhibitions = useExhibitions();
  const createExhibition = useCreateExhibition();
  const updateExhibition = useUpdateExhibition();

  const [form, setForm] = useState<ExhibitionInput>(EMPTY);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<Extracted | null>(null);
  const [importError, setImportError] = useState('');
  const existing = isEdit ? exhibitions.data?.find((e) => e.id === id) : undefined;

  useEffect(() => {
    if (!existing) return;
    setForm({
      museumId: existing.museumId,
      title: existing.title,
      description: existing.description,
      startDate: existing.startDate,
      endDate: existing.endDate,
      price: existing.price,
      imageUrl: existing.imageUrl,
      officialUrl: existing.officialUrl,
      genre: existing.genre,
    });
  }, [existing]);

  if (museums.isLoading || (isEdit && exhibitions.isLoading)) return <Loading />;
  if (isEdit && !existing) return <NotFound />;
  // 自分が登録したものだけ編集できる（DB 側の RLS でも同じ制限をかけてある）
  if (isEdit && existing && existing.createdBy !== userId) {
    return (
      <div className="min-h-[50vh] grid place-items-center px-4 text-center">
        <div>
          <p className="font-bold text-navy-dark">この展覧会は編集できません</p>
          <p className="mt-2 text-sm text-gray-medium">
            編集できるのは、自分で登録した展覧会だけです。情報の誤りを見つけた場合は、
            詳細ページの「情報を報告」からお知らせください。
          </p>
        </div>
      </div>
    );
  }

  const set = <K extends keyof ExhibitionInput>(key: K, value: ExhibitionInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleImport = async () => {
    const url = importUrl.trim();
    if (!url) return;

    setImporting(true);
    setImportError('');
    setImportResult(null);

    try {
      const result = await extractExhibition(url);
      setImportResult(result);
      // 読み取れた項目だけを埋める。空欄で上書きして入力済みの内容を消さない
      setForm((prev) => ({
        ...prev,
        title: result.title || prev.title,
        startDate: result.startDate || prev.startDate,
        endDate: result.endDate || prev.endDate,
        price: result.price || prev.price,
        imageUrl: result.imageUrl || prev.imageUrl,
        description: result.description || prev.description,
        officialUrl: result.sourceUrl || prev.officialUrl,
      }));
    } catch (error) {
      setImportError(error instanceof Error ? error.message : String(error));
    } finally {
      setImporting(false);
    }
  };

  const toggleGenre = (genre: string) =>
    set('genre', form.genre.includes(genre) ? form.genre.filter((g) => g !== genre) : [...form.genre, genre]);

  const valid =
    form.museumId && form.title.trim() && form.startDate && form.endDate && form.endDate >= form.startDate;

  const mutation = isEdit ? updateExhibition : createExhibition;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ExhibitionInput = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      price: form.price.trim(),
      imageUrl: form.imageUrl?.trim() || null,
      officialUrl: form.officialUrl?.trim() || null,
    };

    if (isEdit && id) {
      await updateExhibition.mutateAsync({ id, input: payload });
      navigate(`/exhibition/${id}`, { replace: true });
    } else {
      const newId = await createExhibition.mutateAsync(payload);
      navigate(`/exhibition/${newId}`, { replace: true });
    }
  };

  const field = 'block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold';

  return (
    <div className="min-h-screen bg-gray-light px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-2 text-2xl font-bold text-navy-dark">
          {isEdit ? '展覧会の情報を編集' : '展覧会を登録'}
        </h1>
        <p className="mb-8 border-b pb-4 text-sm text-gray-medium">
          公式サイトに載っている事実（名称・会期・料金）を入力してください。
          紹介文は公式サイトからの転載ではなく、ご自身の言葉でお願いします。
        </p>

        <div className="mb-8 rounded-lg border border-gold-light bg-gold-light/30 p-4">
          <label htmlFor="importUrl" className="mb-2 block text-sm font-bold text-navy-dark">
            公式ページの URL から下書きを作る
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="importUrl"
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://www.example-museum.jp/exhibition/..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={!importUrl.trim() || importing}
              className="shrink-0 rounded-md bg-navy px-5 py-2 font-bold text-white transition hover:bg-navy-medium disabled:opacity-50"
            >
              {importing ? '読み込み中...' : '読み込む'}
            </button>
          </div>

          {importError && <p className="mt-2 text-sm text-red-600">{importError}</p>}

          {importResult && (
            <div className="mt-3 text-sm">
              <p
                className={
                  importResult.confidence === 'high'
                    ? 'font-medium text-green-700'
                    : importResult.confidence === 'medium'
                      ? 'font-medium text-navy-accent'
                      : 'font-medium text-red-600'
                }
              >
                {importResult.confidence === 'high'
                  ? '構造化データから読み取れました'
                  : importResult.confidence === 'medium'
                    ? '本文から推測しました。内容を確認してください'
                    : '会期を読み取れませんでした'}
              </p>
              <ul className="mt-1 text-xs text-gray-medium">
                {importResult.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-3 text-xs text-gray-medium">
            読み取った内容は下の欄に入ります。<strong>必ず目で確認してから</strong>保存してください。
            紹介文は公式サイトの説明文がそのまま入ることがあるため、ご自身の言葉に書き換えてください。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="museum" className="mb-1 block text-sm font-medium text-gray-dark">
              美術館 <span className="text-red-500">*</span>
            </label>
            <select
              id="museum"
              required
              value={form.museumId}
              onChange={(e) => set('museumId', e.target.value)}
              className={field}
            >
              <option value="">選択してください</option>
              {(museums.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-dark">
              展覧会名 <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className={field}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-gray-dark">
                開始日 <span className="text-red-500">*</span>
              </label>
              <input
                id="startDate"
                type="date"
                required
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-gray-dark">
                終了日 <span className="text-red-500">*</span>
              </label>
              <input
                id="endDate"
                type="date"
                required
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className={field}
              />
              {form.startDate && form.endDate && form.endDate < form.startDate && (
                <p className="mt-1 text-xs text-red-600">終了日は開始日以降にしてください。</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="price" className="mb-1 block text-sm font-medium text-gray-dark">
              料金
            </label>
            <input
              id="price"
              type="text"
              placeholder="一般 1800円"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              className={field}
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-gray-dark">ジャンル</span>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    form.genre.includes(genre) ? 'bg-navy text-white' : 'bg-gold-light text-navy'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="officialUrl" className="mb-1 block text-sm font-medium text-gray-dark">
              公式ページの URL
            </label>
            <input
              id="officialUrl"
              type="url"
              placeholder="https://..."
              value={form.officialUrl ?? ''}
              onChange={(e) => set('officialUrl', e.target.value)}
              className={field}
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-dark">
              紹介文
            </label>
            <textarea
              id="description"
              rows={4}
              maxLength={1000}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className={`${field} resize-none`}
            />
          </div>

          {mutation.error && <ErrorState error={mutation.error} />}

          <div className="flex justify-end gap-4 border-t pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-md px-6 py-2 font-medium text-gray-dark hover:bg-gray-100"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!valid || mutation.isPending}
              className="rounded-md bg-gold px-6 py-2 font-bold text-white transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? '保存中...' : isEdit ? '保存する' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
