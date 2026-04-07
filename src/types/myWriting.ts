export type MyWriting = {
  id: string;
  body: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export const MAX_MY_WRITINGS = 90;

export const createMyWriting = (body: string): MyWriting => {
  const now = new Date().toISOString();
  return {
    id: generateMyWritingId(),
    body,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
};

export const updateMyWritingBody = (writing: MyWriting, body: string): MyWriting => ({
  ...writing,
  body,
  updatedAt: new Date().toISOString(),
});

const generateMyWritingId = (): string => {
  const random = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36);
  return `my-writing-${time}-${random}`;
};
