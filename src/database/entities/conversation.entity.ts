import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ChatSession } from "./chat-session.entity";

@Entity("conversations")
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "integer" })
  chatSessionId: number;

  @ManyToOne(() => ChatSession, (chatSession) => chatSession.conversations)
  @JoinColumn({ name: "chatSessionId" })
  chatSession: ChatSession;

  @Column({ type: "text" })
  message: string;

  @Column({ type: "text" })
  response: string;

  @Column({ type: "text", nullable: true })
  context: string; // JSON string with additional context

  @CreateDateColumn()
  timestamp: Date;
}
