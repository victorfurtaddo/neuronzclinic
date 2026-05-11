import { ContactList } from "@/components/chat/contact-list"
import { ChatWindow } from "@/components/chat/chat-window"

export default function ChatsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ContactList />
      <ChatWindow />
    </div>
  )
}
