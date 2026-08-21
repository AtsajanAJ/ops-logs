export type UpdateUserAccessState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialUpdateUserAccessState: UpdateUserAccessState = {
  status: "idle",
  message: "",
};
