/**  Interface commune aux notifications */
export interface NotificationTemplate {
  sendToEmail: string;
  subject: string;
}

export type GetNotificationContent = NotificationTemplate & {
  content: JSX.Element;
};
