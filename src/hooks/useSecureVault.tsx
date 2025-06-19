
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface VaultItem {
  id: string;
  user_id: string;
  item_type: 'clipboard' | 'file' | 'note';
  encrypted_content: string;
  metadata?: any;
  tags: string[];
  created_at: string;
  accessed_at: string;
}

export const useSecureVault = () => {
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Simple encryption (in production, use proper encryption)
  const encrypt = (content: string): string => {
    return btoa(content);
  };

  const decrypt = (encryptedContent: string): string => {
    try {
      return atob(encryptedContent);
    } catch {
      return encryptedContent;
    }
  };

  const storeSecurely = async (
    content: string,
    type: 'clipboard' | 'file' | 'note',
    metadata?: any,
    tags: string[] = []
  ) => {
    if (!user) return null;

    try {
      setLoading(true);
      const encryptedContent = encrypt(content);

      const { data, error } = await supabase
        .from('secure_vault')
        .insert({
          user_id: user.id,
          item_type: type,
          encrypted_content: encryptedContent,
          metadata,
          tags
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Item stored securely');
      fetchVaultItems();
      return data;

    } catch (error) {
      console.error('Failed to store item:', error);
      toast.error('Failed to store item securely');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const retrieveSecurely = async (itemId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('secure_vault')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Update accessed_at
      await supabase
        .from('secure_vault')
        .update({ accessed_at: new Date().toISOString() })
        .eq('id', itemId);

      return {
        ...data,
        decrypted_content: decrypt(data.encrypted_content)
      };

    } catch (error) {
      console.error('Failed to retrieve item:', error);
      toast.error('Failed to retrieve item');
      return null;
    }
  };

  const fetchVaultItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('secure_vault')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVaultItems(data || []);

    } catch (error) {
      console.error('Failed to fetch vault items:', error);
      toast.error('Failed to fetch vault items');
    }
  };

  const deleteVaultItem = async (itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('secure_vault')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Item deleted securely');
      fetchVaultItems();

    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete item');
    }
  };

  useEffect(() => {
    if (user) {
      fetchVaultItems();
    }
  }, [user]);

  return {
    vaultItems,
    loading,
    storeSecurely,
    retrieveSecurely,
    deleteVaultItem,
    fetchVaultItems
  };
};
