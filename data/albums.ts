// 🛡️ 本文件由 Tooki 控制台自动生成，请勿手动修改
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    "id": "blog-assets",
    "title": "嗯 ? 嗯~",
    "description": " 如 数 家 珍",
    "cover": "/uploads/20260514/ec1a572d9d9a4a88bed46b767557e737.jpeg",
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