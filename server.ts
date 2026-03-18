import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });

  (global as any).io = io;

  io.on("connection", (socket) => {
    socket.on("join-channel", (channelId: string) => {
      socket.join(channelId);
    });

    socket.on("leave-channel", (channelId: string) => {
      socket.leave(channelId);
    });

    socket.on("typing", ({ channelId, userName }: { channelId: string; userName: string }) => {
      socket.to(channelId).emit("user-typing", { userName });
    });

    socket.on("stop-typing", ({ channelId }: { channelId: string }) => {
      socket.to(channelId).emit("user-stop-typing");
    });
  });

  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => {
    console.log(`> Servidor rodando na porta ${port}`);
  });
});
