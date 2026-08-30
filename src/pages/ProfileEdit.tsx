import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorState, Loading } from '../components/StateMessage';
import Avatar from '../components/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useUpdateProfile } from '../hooks/queries';

const HANDLE_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export default function ProfileEdit() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();

  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (!profile) return;
    setHandle(profile.handle);
    setDisplayName(profile.displayName);
    setBio(profile.bio);
    setAvatarUrl(profile.avatarUrl ?? '');
  }, [profile]);

  if (!profile) return <Loading />;

  const handleValid = HANDLE_PATTERN.test(handle);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({
      handle,
      displayName: displayName.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim() || null,
    });
    navigate(`/u/${handle}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-light px-4 py-12">
      <div className="mx-auto max-w-xl rounded-lg bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-6 text-2xl font-bold text-navy-dark">プロフィールを編集</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar author={{ displayName: displayName || handle, avatarUrl: avatarUrl || null }} size="md" />
            <div className="flex-1">
              <label htmlFor="avatarUrl" className="mb-1 block text-sm font-medium text-gray-dark">
                アイコン画像の URL
              </label>
              <input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>

          <div>
            <label htmlFor="handle" className="mb-1 block text-sm font-medium text-gray-dark">
              ハンドル
            </label>
            <div className="flex items-center">
              <span className="mr-1 text-gray-500">@</span>
              <input
                id="handle"
                type="text"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <p className={`mt-1 text-xs ${handle && !handleValid ? 'text-red-600' : 'text-gray-500'}`}>
              半角英数字とアンダースコア、3〜20文字。プロフィールの URL になります。
            </p>
          </div>

          <div>
            <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-gray-dark">
              表示名
            </label>
            <input
              id="displayName"
              type="text"
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label htmlFor="bio" className="mb-1 block text-sm font-medium text-gray-dark">
              自己紹介
            </label>
            <textarea
              id="bio"
              rows={4}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="好きな美術館やジャンルなど"
              className="block w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <p className="mt-1 text-right text-xs text-gray-500">{bio.length} / 500</p>
          </div>

          {updateProfile.error && <ErrorState error={updateProfile.error} />}

          <div className="flex justify-end gap-4 border-t pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-md px-6 py-2 font-medium text-gray-dark transition-colors hover:bg-gray-100"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!handleValid || updateProfile.isPending}
              className="rounded-md bg-gold px-6 py-2 font-bold text-white transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateProfile.isPending ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
