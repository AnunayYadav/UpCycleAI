
import React from 'react';
import { X, Twitter, Facebook, Linkedin, MessageCircle, Copy } from 'lucide-react';
import { UserProfile, LEVELS } from '../types';

interface ShareModalProps {
  userProfile: UserProfile;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ userProfile, onClose }) => {
  const currentTitle = LEVELS.find(l => l.level === userProfile.level)?.title || "Scavenger";
  
  const shareText = `I've reached Level ${userProfile.level} (${currentTitle}) on UpcycleAI! ♻️\n\n` +
    `📦 ${userProfile.scansCount} Items Scanned\n` +
    `🔨 ${userProfile.buildsCount} Projects Built\n` +
    `🔥 ${userProfile.streak} Day Streak\n\n` +
    `Turn your trash into treasure! #UpcycleAI #Sustainability #DIY`;

  const encodedText = encodeURIComponent(shareText);
  const currentUrl = encodeURIComponent(window.location.href);

  const shareLinks = [
    {
      name: 'Twitter',
      icon: <Twitter className="w-6 h-6 text-white" />,
      color: 'bg-blue-400',
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${currentUrl}`
    },
    {
      name: 'Facebook',
      icon: <Facebook className="w-6 h-6 text-white" />,
      color: 'bg-blue-600',
      url: `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}&quote=${encodedText}`
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="w-6 h-6 text-white" />,
      color: 'bg-green-500',
      url: `https://wa.me/?text=${encodedText} ${currentUrl}`
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="w-6 h-6 text-white" />,
      color: 'bg-blue-700',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}`
    }
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
    alert("Copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl relative animate-scaleIn">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Share Your Impact</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          Inspire others to join the movement!
        </p>

        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 mb-6 italic border-l-4 border-green-500">
          "{shareText}"
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {shareLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${link.color} aspect-square rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}
              onClick={onClose}
            >
              {link.icon}
            </a>
          ))}
        </div>

        <button 
          onClick={copyToClipboard}
          className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Copy className="w-4 h-4" />
          Copy Text
        </button>
      </div>
    </div>
  );
};

export default ShareModal;
