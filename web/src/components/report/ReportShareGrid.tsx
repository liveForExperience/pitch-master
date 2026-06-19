import { Browser } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import type { ShareReportInput } from '../../lib/share-report';
import { useT } from '../../i18n';
import { reportActionTileClass, reportActionIconClass } from './report-action-styles';
import { ShareReportButton } from './ShareReportButton';

type Props = {
  share: ShareReportInput;
  reportPath: string;
  shareLabel?: string;
  previewLabel?: string;
  className?: string;
};

/** Equal-weight share + H5 preview actions for event/game detail pages. */
export function ReportShareGrid({
  share,
  reportPath,
  shareLabel,
  previewLabel,
  className,
}: Props) {
  const t = useT();

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      <ShareReportButton
        share={share}
        variant="secondary"
        layout="tile"
        label={shareLabel ?? t('share.label')}
      />
      <Link to={reportPath} className={reportActionTileClass}>
        <Browser size={22} weight="bold" className={reportActionIconClass} aria-hidden />
        <span>{previewLabel ?? t('share.previewReport')}</span>
      </Link>
    </div>
  );
}
