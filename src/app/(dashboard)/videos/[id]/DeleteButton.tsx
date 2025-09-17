'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { deleteVideo } from '../../actions';
import { useRouter } from 'next/navigation';

export default function DeleteButton({ videoId }: { videoId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this video?')) {
      setIsDeleting(true);
      try {
        await deleteVideo(videoId);
        router.push('/videos');
      } catch (error) {
        alert('Failed to delete video. Please try again.');
        setIsDeleting(false);
      }
    }
  };

  return (
    <Button
      variant="outline"
      className="brutal-shadow border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash className="w-4 h-4 mr-2" />
      {isDeleting ? 'Deleting...' : 'Delete Video'}
    </Button>
  );
}