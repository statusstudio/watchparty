export type UserRole = 'reader' | 'writer' | 'admin';
export type NovelType = 'text' | 'chat';
export type NovelStatus = 'ongoing' | 'completed' | 'hiatus';
export type ChapterStatus = 'draft' | 'published' | 'scheduled';
export type CoinTxType = 'topup' | 'chapter_unlock' | 'donation' | 'payout';

export interface Profile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  role: UserRole;
  coinBalance: number;
  createdAt: string;
}

export interface Novel {
  id: string;
  authorId: string;
  authorName?: string;
  title: string;
  slug?: string;
  synopsis: string;
  coverUrl: string;
  category: string;
  tags: string[];
  type: NovelType;
  status: NovelStatus;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageItem {
  id: number | string;
  sender: string;
  avatar: string;
  message: string;
  isMe: boolean;
  time: string;
}

export interface Chapter {
  id: string;
  novelId: string;
  chapterNumber: number;
  title: string;
  contentText?: string;
  contentChat?: ChatMessageItem[];
  coinPrice: number;
  status: ChapterStatus;
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
}

export interface ApiKeyItem {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsed: string;
  isActive: boolean;
}
