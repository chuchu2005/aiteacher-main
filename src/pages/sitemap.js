import React from 'react';

const sitemapData = [
  {
    loc: "https://aiteacher.learnrithm.com/",
    lastmod: "2024-07-16T08:53:32+00:00",
  },
  {
    loc: "https://aiteacher.learnrithm.com/sign-up",
    lastmod: "2024-07-16T14:22:01+00:00",
    priority: 0.8,
  },
  {
    loc: "https://aiteacher.learnrithm.com/sign-up",
    lastmod: "2024-07-16T14:22:01+00:00",
    priority: 0.8,
  },
];

const Sitemap = () => {
  return (
    <div>
      <h1>Sitemap</h1>
      <div xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        {sitemapData.map((url, index) => (
          <div key={index}>
            <p>URL: <a href={url.loc}>{url.loc}</a></p>
            <p>Last Modified: {url.lastmod}</p>
            {url.priority && <p>Priority: {url.priority}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sitemap;
