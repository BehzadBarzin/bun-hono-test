export type TPaginatedResponseMeta = {
  count: number;
  page: number;
  totalPages: number;
};

export type TPaginatedResponse<T> = {
  data: T[];
  meta: TPaginatedResponseMeta;
};
