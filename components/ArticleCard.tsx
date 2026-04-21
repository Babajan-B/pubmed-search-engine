'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BorderBeam } from '@/components/ui/border-beam';
import type { Article } from '@/app/api/search/route';

const QUARTILE_VARIANT: Record<string, string> = {
  Q1: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Q2: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Q3: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Q4: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function ArticleCard({ article }: { article: Article }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const hasAbstract =
    article.abstract &&
    article.abstract !== 'No abstract available' &&
    article.abstract !== 'Abstract temporarily unavailable';

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="p-5">
          {/* Title */}
          <a
            href={article.pubmedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary hover:underline underline-offset-2 leading-snug block mb-2"
          >
            {article.title}
          </a>

          {/* Journal + year + authors */}
          <p className="text-xs text-muted-foreground mb-3">
            <span className="font-medium text-foreground/80">{article.journal}</span>
            {' · '}{article.year}
            {article.authors && (
              <span className="text-muted-foreground/70">{' · '}{article.authors}</span>
            )}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Badge variant="outline" className="text-[11px] py-0">{article.type}</Badge>
            {article.quartile && (
              <Badge variant="outline" className={`text-[11px] py-0 ${QUARTILE_VARIANT[article.quartile] ?? ''}`}>
                {article.quartile}
              </Badge>
            )}
            {article.jif !== null && article.jif !== undefined && (
              <Badge variant="outline" className="text-[11px] py-0 bg-violet-500/15 text-violet-400 border-violet-500/30">
                JIF&nbsp;{article.jif}
              </Badge>
            )}
            {article.category && (
              <Badge variant="outline" className="text-[11px] py-0">{article.category}</Badge>
            )}
            {article.authorCountries.slice(0, 2).map((country) => (
              <Badge
                key={country}
                variant="outline"
                className="text-[11px] py-0 bg-sky-500/15 text-sky-300 border-sky-500/30"
              >
                {country}
              </Badge>
            ))}
            {article.authorCountries.length > 2 && (
              <Badge variant="outline" className="text-[11px] py-0">
                +{article.authorCountries.length - 2} countries
              </Badge>
            )}
          </div>

          {/* Abstract toggle */}
          {hasAbstract && (
            <div>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-[11px] text-primary/70 hover:text-primary transition"
              >
                {expanded ? '▲ Hide abstract' : '▼ Show abstract'}
              </button>
              {expanded && (
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed whitespace-pre-line border-t border-border pt-2">
                  {article.abstract}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* BorderBeam animates on hover */}
      {hovered && (
        <BorderBeam size={200} duration={8} colorFrom="#6366f1" colorTo="#a855f7" borderWidth={1} />
      )}
    </div>
  );
}
