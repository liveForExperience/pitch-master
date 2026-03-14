import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Button, Toast } from 'antd-mobile';
import { Share2 } from 'lucide-react';
import dayjs from 'dayjs';

interface MatchPosterProps {
  match: any;
  games: any[];
}

const MatchPoster: React.FC<MatchPosterProps> = ({ match, games }) => {
  const posterRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!posterRef.current) return;
    
    Toast.show({ icon: 'loading', content: '生成中...', duration: 0 });
    
    try {
      const canvas = await html2canvas(posterRef.current, {
        useCORS: true,
        scale: 2, // 提高清晰度
        backgroundColor: '#0a0a0a',
      });
      
      const link = document.createElement('a');
      link.download = `战报_${match.title}_${dayjs().format('MMDD')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      Toast.clear();
      Toast.show({ icon: 'success', content: '战报已生成，请长按保存' });
    } catch (err) {
      console.error(err);
      Toast.clear();
      Toast.show({ icon: 'fail', content: '生成失败' });
    }
  };

  return (
    <div className="mt-8 px-4">
      {/* 隐藏的导出区域 */}
      <div className="fixed -left-[9999px] top-0">
        <div 
          ref={posterRef}
          className="w-[375px] bg-neutral-950 p-8 text-white font-sans relative overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(circle at top right, #1DB954 0%, transparent 40%)' }}
        >
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 opacity-10 text-90px font-black italic select-none pointer-events-none">
            OLDBOY
          </div>

          <div className="relative z-10">
            <div className="mb-10">
              <div className="text-primary font-bold tracking-widest text-xs mb-2 uppercase">Match Report</div>
              <h1 className="text-3xl font-black leading-tight mb-4">{match.title}</h1>
              <div className="flex space-x-4 text-xs text-neutral-400">
                <span>{dayjs(match.startTime).format('YYYY.MM.DD HH:mm')}</span>
                <span>@{match.location}</span>
              </div>
            </div>

            <div className="space-y-8 mb-12">
              {games.map((game, idx) => (
                <div key={game.id} className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Match {idx + 1}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-xl font-bold italic">TEAM {game.teamAIndex + 1}</span>
                        <span className="text-3xl font-black text-primary">{game.scoreA} : {game.scoreB}</span>
                        <span className="text-xl font-bold italic">TEAM {game.teamBIndex + 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-neutral-800 flex justify-between items-end">
              <div>
                <div className="text-[10px] text-neutral-500 font-bold mb-1 uppercase tracking-tighter">Powered by</div>
                <div className="text-lg font-black italic tracking-tighter">OLDBOY <span className="text-primary">CLUB</span></div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-neutral-500 font-bold mb-1 uppercase">Stats Summary</div>
                <div className="text-xs font-medium">人均费用: ¥{match.perPersonCost}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button 
        block 
        color="primary" 
        size="large" 
        onClick={handleDownload}
        className="rounded-2xl py-4 flex items-center justify-center font-bold"
      >
        <Share2 className="mr-2 text-xl" /> 生成朋友圈战报卡片
      </Button>
    </div>
  );
};

export default MatchPoster;
