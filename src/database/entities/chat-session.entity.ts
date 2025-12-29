import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Conversation } from "./conversation.entity";

@Entity("chat_sessions")
export class ChatSession {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: "boolean", default: false })
  isActive: boolean;

  @Column({ type: "text", nullable: true })
  conversationSummary: string; // JSON string with compressed conversation context

  @Column({ type: "integer", default: 0 })
  messageCount: number; // Track total messages to determine when to update summary

  @OneToMany(() => Conversation, (conversation) => conversation.chatSession)
  conversations: Conversation[];
}
