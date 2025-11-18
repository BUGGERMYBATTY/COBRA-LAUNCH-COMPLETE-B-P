import React, { useState, useMemo, useCallback } from 'react';
import type { TokenData } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { CheckIcon } from './icons/CheckIcon';
import { uploadImageToPinata } from '../lib/pinata';


interface TokenFormProps {
  onSubmit: (data: Omit<TokenData, 'image'> & { image: string }) => void;
  isLoading: boolean;
  isConfirmModalOpen: boolean;
}

const TokenForm: React.FC<TokenFormProps> = ({ onSubmit, isLoading, isConfirmModalOpen }) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // Optional social/web links
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      setError('Image size must be less than 2MB.');
      return;
    }
    setError('');
    setIsUploading(true);
    setImage(null);

    try {
      const ipfsUrl = await uploadImageToPinata(file, name, symbol);
      setImage(ipfsUrl);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const missingFields = useMemo(() => {
    const missing = [];
    if (name.trim() === '') missing.push('Token Name');
    if (symbol.trim() === '') missing.push('Token Symbol');
    if (symbol.length > 10) missing.push('Symbol is too long');
    if (image === null) missing.push('Token Image');
    return missing;
  }, [name, symbol, image]);

  const isFormValid = missingFields.length === 0;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid && image) {
      // Use configured treasury address from environment
      const treasuryAddress = import.meta.env.VITE_TREASURY_ADDRESS || '';
      onSubmit({
        name,
        symbol,
        image,
        treasuryAddress,
        // Include optional fields if provided
        ...(description && { description }),
        ...(website && { website }),
        ...(twitter && { twitter }),
        ...(telegram && { telegram })
      });
    }
  };

  const InputField = useCallback(<T,>({id, label, value, onChange, placeholder, maxLength, type = "text"}: {id: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; placeholder: string; maxLength?: number; type?: string}) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-brand-text-secondary mb-2">{label}</label>
      {type === 'textarea' ? (
        <textarea id={id} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} rows={4} className="w-full bg-brand-bg-transparent border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition duration-200" />
      ) : (
        <input type={type} id={id} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} className="w-full bg-brand-bg-transparent border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition duration-200" />
      )}
      {maxLength && <p className="text-xs text-right text-brand-text-secondary mt-1">{value.length}/{maxLength}</p>}
    </div>
  ), []);


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField id="token-name" label="Token Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My Awesome Coin" maxLength={32} />
        <InputField id="token-symbol" label="Token Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="e.g. MAC" maxLength={10} />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-2">Token Image</label>
        <div className="mt-2 flex justify-center rounded-lg border-2 border-dashed border-brand-border px-6 py-10 hover:border-brand-accent transition-colors duration-200">
          <div className="text-center">
            {isUploading ? (
               <div className="mx-auto h-24 w-24 flex items-center justify-center">
                  <svg className="animate-spin h-10 w-10 text-brand-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
               </div>
            ) : image ? (
              <img src={image} alt="Token preview" className="mx-auto h-24 w-24 rounded-full object-cover" />
            ) : (
              <UploadIcon className="mx-auto h-12 w-12 text-brand-text-secondary" />
            )}
            <div className="mt-4 flex text-sm leading-6 text-brand-text-secondary">
              <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-brand-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-accent focus-within:ring-offset-2 focus-within:ring-offset-brand-surface hover:text-brand-accent-hover">
                <span>{image ? 'Change image' : 'Upload an image'}</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} disabled={isUploading || isConfirmModalOpen} />
              </label>
              {!image && <p className="pl-1">or drag and drop</p>}
            </div>
            <p className="text-xs leading-5 text-brand-text-secondary/80">Recommended: 512x512px. PNG, JPG, GIF. Max 2MB.</p>
          </div>
        </div>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      <InputField id="token-description" label="Description (Optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your token's purpose and vision." maxLength={200} type="textarea"/>

      {/* Social & Web Links Section */}
      <div className="space-y-4 rounded-lg bg-purple-900/20 p-4 border border-purple-500/30">
        <h3 className="font-semibold text-brand-text uppercase text-sm">Social & Web Links (Optional)</h3>
        <p className="text-xs text-brand-text-secondary">Add links to help your community find you</p>

        <div className="space-y-4">
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-brand-text-secondary mb-2">
              🌐 Website
            </label>
            <input
              type="url"
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourproject.com"
              className="w-full bg-brand-bg-transparent border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition duration-200"
            />
          </div>

          <div>
            <label htmlFor="twitter" className="block text-sm font-medium text-brand-text-secondary mb-2">
              𝕏 Twitter / X
            </label>
            <input
              type="text"
              id="twitter"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://twitter.com/yourproject or @yourproject"
              className="w-full bg-brand-bg-transparent border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition duration-200"
            />
          </div>

          <div>
            <label htmlFor="telegram" className="block text-sm font-medium text-brand-text-secondary mb-2">
              ✈️ Telegram
            </label>
            <input
              type="text"
              id="telegram"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="https://t.me/yourproject or @yourproject"
              className="w-full bg-brand-bg-transparent border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition duration-200"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">Token Supply</label>
            <div className="w-full bg-brand-bg-transparent border border-brand-border rounded-lg p-3 text-brand-text-secondary">1,000,000,000</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">Decimals</label>
            <div className="w-full bg-brand-bg-transparent border border-brand-border rounded-lg p-3 text-brand-text-secondary">9</div>
          </div>
      </div>
      
      <div className="space-y-4 rounded-lg bg-brand-bg-transparent p-4 border border-brand-border shadow-glow-purple">
        <h3 className="font-semibold text-brand-text uppercase">Authority Settings</h3>
        <div className="flex items-center">
            <div className="h-5 w-5 flex items-center justify-center rounded bg-brand-accent text-black">
                <CheckIcon className="h-4 w-4" />
            </div>
            <span className="ml-3 text-sm text-brand-text-secondary">Revoke Mint Authority</span>
        </div>
        <div className="flex items-center">
            <div className="h-5 w-5 flex items-center justify-center rounded bg-brand-accent text-black">
                <CheckIcon className="h-4 w-4" />
            </div>
            <span className="ml-3 text-sm text-brand-text-secondary">Revoke Freeze Authority</span>
        </div>
      </div>
      
      <div className="text-center text-sm text-brand-text-secondary p-3 bg-brand-bg-transparent border border-brand-border rounded-lg">
        Creation Fee: <span className="font-bold text-brand-accent">0.1 SOL</span>. This covers all transaction costs.
      </div>

      <div className="relative group">
        <button type="submit" disabled={!isFormValid || isLoading || isUploading || isConfirmModalOpen} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface focus:ring-brand-accent transition-all duration-300 uppercase">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              CREATING TOKEN...
            </>
          ) : 'CREATE TOKEN'}
        </button>
        {!isFormValid && !isLoading && !isUploading && !isConfirmModalOpen && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-brand-bg border border-brand-border rounded-md shadow-lg text-sm text-brand-text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <p className="font-semibold text-left">Please complete the following:</p>
              <ul className="list-disc list-inside mt-1 text-left">
                {missingFields.map(field => <li key={field}>{field}</li>)}
              </ul>
            </div>
          )}
      </div>
    </form>
  );
};

export default TokenForm;