import { ClipStatus } from '../types';

type ClipButtonProps = {
  status: ClipStatus;
  onStatusChange: (s: ClipStatus) => void;
  size?: 'sm' | 'lg';
};

export default function ClipButton({ status, onStatusChange, size = 'sm' }: ClipButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (status === 'none') onStatusChange('want');
    else if (status === 'want') onStatusChange('visited');
    else onStatusChange('none');
  };

  const paddingClass = size === 'sm' ? 'px-3 py-1 text-sm' : 'px-5 py-2 text-base';
  
  let content;
  let classes = `inline-flex items-center justify-center rounded-full border transition cursor-pointer font-medium ${paddingClass} `;
  
  switch(status) {
    case 'want':
      classes += 'bg-gold text-white border-gold hover:bg-yellow-600';
      content = <><span className="mr-1">♥</span> 行きたい</>;
      break;
    case 'visited':
      classes += 'bg-green-600 text-white border-green-600 hover:bg-green-700';
      content = <><span className="mr-1">✓</span> 行った</>;
      break;
    case 'none':
    default:
      classes += 'bg-white text-navy border-gray-300 hover:bg-gray-50';
      content = <><span className="mr-1">♡</span> クリップ</>;
      break;
  }

  return (
    <button type="button" onClick={handleClick} className={classes}>
      {content}
    </button>
  );
}
