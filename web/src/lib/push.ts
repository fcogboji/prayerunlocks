type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default" | null;
};

export async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  if (!token.startsWith("ExponentPushToken")) {
    return;
  }

  const message: ExpoPushMessage = {
    to: token,
    title,
    body,
    sound: "default",
    data,
  };

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error("Expo push failed:", error);
  }
}

export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  const { prisma } = await import("./prisma");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushToken: true },
  });

  if (user?.pushToken) {
    await sendExpoPush(user.pushToken, title, body, data);
  }
}
