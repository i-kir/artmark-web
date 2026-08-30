import { Suspense, lazy } from 'react';
import type { ComponentProps } from 'react';
import type MuseumMapImpl from './MuseumMapImpl';

// Leaflet と leaflet.css は 200KB 近くあるため、地図を表示する画面だけで読み込む
const Impl = lazy(() => import('./MuseumMapImpl'));

type Props = ComponentProps<typeof MuseumMapImpl>;

export default function MuseumMap(props: Props) {
  return (
    <Suspense
      fallback={
        <div className={props.className ?? 'h-[60vh] min-h-[320px] w-full rounded-xl'}>
          <div className="grid h-full w-full place-items-center rounded-xl bg-gray-200 text-sm text-gray-500">
            地図を読み込み中...
          </div>
        </div>
      }
    >
      <Impl {...props} />
    </Suspense>
  );
}
