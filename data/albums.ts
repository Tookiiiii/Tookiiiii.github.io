// 🛡️ 本文件由 Tooki 迁移配置生成
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    "id": "blog-assets",
    "title": "博客素材",
    "description": "从旧博客保留下来的头像、背景和站点素材。",
    "cover": "/img/bizhi.png",
    "date": "2026.05",
    "photos": [
      {
        "url": "/img/zipai.png",
        "caption": "头像"
      },
      {
        "url": "/img/bizhi.png",
        "caption": "旧博客背景"
      },
      {
        "url": "/img/bochi.jpg",
        "caption": "旧博客图片素材"
      }
    ]
  }
];
