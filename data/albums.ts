// 🛡️ 本文件由 Tooki 控制台自动生成，请勿手动修改
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    "id": "blog-assets",
    "title": "嗯 ? 嗯~",
    "description": " 如 数 家 珍",
    "cover": "/uploads/20260512/eae48c20068f4da6b2d984bf9ad64a90.jpeg",
    "date": "2026.05",
    "photos": [
      {
        "url": "/img/zipai.png",
        "caption": "这就是我("
      },
      {
        "url": "/img/bizhi.png",
        "caption": "xni1"
      },
      {
        "url": "/img/bochi.jpg",
        "caption": "hua"
      }
    ]
  }
];