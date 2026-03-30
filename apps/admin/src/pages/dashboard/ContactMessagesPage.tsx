import { useState, useEffect } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Mail, Search, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null,
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );
  const { toast } = useToast();
  const axiosPrivate = useAxiosPrivate();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data } = await axiosPrivate.get("/contact");
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch contact messages", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsViewModalOpen(true);
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      setDeletingMessageId(messageToDelete);
      setMessageToDelete(null);

      await axiosPrivate.delete(`/contact/${messageToDelete}`);

      toast({
        title: "Success",
        description: "Message deleted successfully",
      });

      fetchMessages();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete message",
      });
    } finally {
      setDeletingMessageId(null);
    }
  };

  const filteredMessages = messages.filter(
    (msg) =>
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Contact Messages</h1>
        <p className="text-muted-foreground">
          View and manage messages submitted through the store contact form
        </p>
      </div>

      <Card className="p-4 border-dashed bg-slate-50/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search explicitly by name, email or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            Total Records: {filteredMessages.length}
          </div>
        </div>
      </Card>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b">
              <TableRow>
                <TableHead className="w-[150px] font-semibold text-slate-700">
                  Date Received
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Customer Info
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Subject
                </TableHead>
                <TableHead className="w-[80px] text-center font-semibold text-slate-700">
                  Status
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p>Loading contact messages...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredMessages.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                      <Mail className="w-10 h-10 text-muted-foreground" />
                      <p className="text-base font-medium">No messages found</p>
                      {searchQuery && (
                        <p className="text-sm">
                          Try adjusting your search query
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMessages.map((message) =>
                  deletingMessageId === message._id ? (
                    <TableRow
                      key={`skeleton-${message._id}`}
                      className="hover:bg-transparent"
                    >
                      <TableCell colSpan={5} className="p-4">
                        <div className="flex items-center space-x-4 animate-pulse">
                          <div className="h-10 w-24 bg-slate-200 rounded"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                            <div className="h-3 w-1/4 bg-slate-200 rounded"></div>
                          </div>
                          <div className="h-4 w-1/2 bg-slate-200 rounded flex-1"></div>
                          <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                          <div className="h-8 w-24 bg-slate-200 rounded flex gap-2 justify-end"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow
                      key={message._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                        {format(new Date(message.createdAt), "MMM d, yyyy")}
                        <div className="text-xs opacity-70 mt-0.5">
                          {format(new Date(message.createdAt), "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">
                          {message.name}
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5 flexItems-center gap-1">
                          <a
                            href={`mailto:${message.email}`}
                            className="hover:underline hover:text-primary transition-colors"
                          >
                            {message.email}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-slate-800 line-clamp-1">
                          {message.subject}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        >
                          Pending
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewMessage(message)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              (window.location.href = `mailto:${message.email}?subject=Re: ${message.subject}`)
                            }
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="Reply via Email"
                          >
                            <Mail className="h-4 w-4" />
                            <span className="sr-only">Reply via Email</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMessageToDelete(message._id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete Record</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ),
                )
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View Message Sidebar */}
      <Sheet open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <SheetContent className="w-full sm:max-w-md border-l p-0 flex flex-col h-full bg-white shadow-2xl">
          <SheetHeader className="px-6 py-5 border-b bg-slate-50/80">
            <SheetTitle className="flex items-center gap-2.5 text-xl font-semibold text-slate-800">
              <div className="bg-primary/10 p-2 rounded-full">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              Message Details
            </SheetTitle>
          </SheetHeader>

          {selectedMessage && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-8">
                <div className="space-y-6 text-sm bg-white">
                  <div>
                    <h4 className="flex items-center gap-1.5 text-slate-500 font-semibold mb-2 text-xs uppercase tracking-wider">
                      Sender Information
                    </h4>
                    <div className="bg-slate-50 border rounded-xl p-4 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Name
                        </p>
                        <p className="font-semibold text-slate-900 border-b border-transparent">
                          {selectedMessage.name}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60">
                        <p className="text-xs text-muted-foreground mb-1">
                          Email Address
                        </p>
                        <a
                          href={`mailto:${selectedMessage.email}`}
                          className="font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                        >
                          {selectedMessage.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-slate-500 font-semibold mb-2 text-xs uppercase tracking-wider">
                      Date Received
                    </h4>
                    <div className="bg-slate-50 border rounded-xl p-4">
                      <p className="font-medium text-slate-700">
                        {format(
                          new Date(selectedMessage.createdAt),
                          "MMMM d, yyyy 'at' h:mm a",
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="flex items-center justify-between text-slate-500 font-semibold text-xs uppercase tracking-wider border-b pb-2">
                    Message Content
                  </h4>

                  <div className="bg-slate-50/50 border rounded-xl shadow-sm">
                    <div className="p-4 border-b bg-white rounded-t-xl">
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {selectedMessage.subject}
                      </h3>
                    </div>
                    <div className="p-5 text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-[15px]">
                      {selectedMessage.message}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 border-t bg-slate-50 mt-auto">
            <Button
              className="w-full gap-2 font-semibold shadow-sm"
              onClick={() =>
                (window.location.href = `mailto:${selectedMessage?.email}?subject=Re: ${selectedMessage?.subject}`)
              }
            >
              <Mail className="w-4 h-4" /> Reply to Message
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!messageToDelete}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              contact message and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
