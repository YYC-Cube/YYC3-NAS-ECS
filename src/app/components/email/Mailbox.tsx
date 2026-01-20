import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Email } from '../../types';
import { cn } from '../../components/ui/utils';
import { 
  Inbox, 
  Send, 
  Trash2, 
  File, 
  Search, 
  MoreVertical, 
  Reply, 
  Forward,
  Mail
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

type Folder = 'inbox' | 'sent' | 'trash' | 'drafts';

export const Mailbox: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState<Folder>('inbox');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEmails(activeFolder);
  }, [activeFolder]);

  const loadEmails = async (folder: Folder) => {
    setLoading(true);
    try {
      const data = await api.mail.getEmails(folder);
      setEmails(data);
      if (data.length > 0) {
        setSelectedEmail(data[0]);
      } else {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = emails.filter(email => 
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r flex flex-col p-4 gap-2">
        <Button 
          className="w-full justify-start gap-2" 
          variant={activeFolder === 'inbox' ? 'secondary' : 'ghost'}
          onClick={() => setActiveFolder('inbox')}
        >
          <Inbox size={18} /> Inbox
          <Badge variant="secondary" className="ml-auto">12</Badge>
        </Button>
        <Button 
          className="w-full justify-start gap-2" 
          variant={activeFolder === 'sent' ? 'secondary' : 'ghost'}
          onClick={() => setActiveFolder('sent')}
        >
          <Send size={18} /> Sent
        </Button>
        <Button 
          className="w-full justify-start gap-2" 
          variant={activeFolder === 'drafts' ? 'secondary' : 'ghost'}
          onClick={() => setActiveFolder('drafts')}
        >
          <File size={18} /> Drafts
        </Button>
        <Button 
          className="w-full justify-start gap-2" 
          variant={activeFolder === 'trash' ? 'secondary' : 'ghost'}
          onClick={() => setActiveFolder('trash')}
        >
          <Trash2 size={18} /> Trash
        </Button>
      </div>

      {/* Email List */}
      <div className="w-80 border-r flex flex-col bg-white">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search mail..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {loading ? (
               <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : filteredEmails.length === 0 ? (
               <div className="p-8 text-center text-gray-500">No emails found</div>
            ) : (
              filteredEmails.map(email => (
                <button
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={cn(
                    "flex flex-col items-start gap-2 p-4 text-left hover:bg-gray-50 transition-colors border-b last:border-0",
                    selectedEmail?.id === email.id && "bg-blue-50/50 hover:bg-blue-50/70"
                  )}
                >
                  <div className="flex w-full flex-col gap-1">
                    <div className="flex items-center">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-sm">{email.from}</div>
                        {!email.read && (
                          <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <div className="ml-auto text-xs text-gray-500">
                        {new Date(email.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs font-medium">{email.subject}</div>
                  </div>
                  <div className="line-clamp-2 text-xs text-gray-500">
                    {email.body.substring(0, 300)}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Email Detail */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedEmail ? (
          <>
            <div className="flex items-center p-4 border-b gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Button variant="ghost" size="icon"><Trash2 size={18} /></Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="ghost" size="icon"><Reply size={18} /></Button>
                <Button variant="ghost" size="icon"><Forward size={18} /></Button>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="icon"><MoreVertical size={18} /></Button>
              </div>
            </div>
            <ScrollArea className="flex-1 p-8">
              <div className="flex items-start gap-4 mb-8">
                <Avatar>
                  <AvatarImage src={`https://avatar.vercel.sh/${selectedEmail.from}`} />
                  <AvatarFallback>{selectedEmail.from[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <div className="font-semibold">{selectedEmail.from}</div>
                  <div className="text-xs text-gray-500">To: {selectedEmail.to}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(selectedEmail.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-4">{selectedEmail.subject}</h1>
              <div className="prose prose-sm max-w-none text-gray-700">
                <p>{selectedEmail.body}</p>
                {/* Simulated long content */}
                <p className="mt-4">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                  Ut enim ad minimdV, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p className="mt-4">
                  Best regards,<br />
                  {selectedEmail.from.split('@')[0]}
                </p>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Mail size={48} className="mb-4 opacity-20" />
            <p>Select an email to read</p>
          </div>
        )}
      </div>
    </div>
  );
};
