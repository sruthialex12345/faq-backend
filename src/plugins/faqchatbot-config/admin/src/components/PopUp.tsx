import React, { useState, useEffect } from 'react';
import {
  Modal,
  Typography,
  Button,
  Box,
  Flex,
  TextInput,
  Textarea,
  Loader,
} from '@strapi/design-system';
import { Plus, Trash, ArrowLeft } from '@strapi/icons';
import { useFetchClient } from '@strapi/admin/strapi-admin';

interface PopUpProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  type: 'key' | 'business' | 'style' | 'logo' | 'domain' | 'contact' | 'collections' | 'suggestion' | null;
  initialData: any;
  availableCollections?: any[];
}

const PopUp = ({ isOpen, onClose, onSave, type, initialData, availableCollections = [] }: PopUpProps) => {
  const [tempData, setTempData] = useState<any>('');

  // States for the internal Image Picker
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  const { get } = useFetchClient();

  useEffect(() => {
    if (isOpen) {
      setTempData(initialData);
      setIsPickerOpen(false);
    }
  }, [isOpen, initialData]);

  // Fetch images from Media Library when the picker view is opened
  useEffect(() => {
    if (isPickerOpen) {
      const fetchAssets = async () => {
        setIsLoadingAssets(true);
        try {
          const { data } = await get('/upload/files?sort=createdAt:DESC&pagination[pageSize]=24');
          setAssets(data.results || []);
        } catch (err) {
          console.error("Failed to fetch assets", err);
        } finally {
          setIsLoadingAssets(false);
        }
      };
      fetchAssets();
    }
  }, [isPickerOpen, get]);

  if (!isOpen || !type) return null;

  // Restore the logic for toggling collections
  const handleToggleCollection = (uid: string) => {
    setTempData((prev: string[]) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const getModalContent = () => {
    // IMAGE PICKER GRID VIEW
    if (type === 'logo' && isPickerOpen) {
      return (
        <Flex direction="column" gap={4} alignItems="stretch">
          <Button variant="tertiary" startIcon={<ArrowLeft />} onClick={() => setIsPickerOpen(false)}>
            Back to Preview
          </Button>

          {isLoadingAssets ? (
            <Flex justifyContent="center" padding={8}><Loader /></Flex>
          ) : (
            <Flex wrap="wrap" gap={4}>
              {assets.map((asset) => (
                <Box
                  key={asset.id}
                  as="button"
                  type="button"
                  onClick={() => {
                    setTempData(asset.url);
                    setIsPickerOpen(false);
                  }}
                  hasRadius
                  background="neutral100"
                  style={{
                    width: 'calc(25% - 12px)',
                    aspectRatio: '1/1',
                    overflow: 'hidden',
                    border: '1px solid #eaeaef',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
              ))}
            </Flex>
          )}
        </Flex>
      );
    }

    // MAIN VIEWS
    switch (type) {
      case 'key':
      case 'domain':
      case 'contact':
        return (
          <TextInput
            label={type === 'key' ? "API Key" : type === 'domain' ? "Base Domain" : "Contact Link"}
            placeholder="..."
            type={type === 'key' ? "password" : "text"}
            value={tempData}
            onChange={(e: any) => setTempData(e.target.value)}
          />
        );

      case 'suggestion':
        return (
          <TextInput
            label="Question Text"
            placeholder="e.g. How do I track my order?"
            value={tempData}
            onChange={(e: any) => setTempData(e.target.value)}
          />
        );

      case 'business':
      case 'style':
        return (
          <Textarea
            label={type === 'business' ? "Business Logic Prompt" : "Response Style Prompt"}
            value={tempData}
            onChange={(e: any) => setTempData(e.target.value)}
            style={{ minHeight: '200px' }}
          />
        );

      case 'logo':
        return (
          <Flex direction="column" gap={4} alignItems="stretch">
            <Typography variant="pi" fontWeight="bold" textColor="neutral600">Logo Preview</Typography>
            <Box padding={tempData ? 4 : 10} hasRadius background="neutral100" borderStyle="dashed" borderWidth="1px" borderColor="neutral300"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}
            >
              {tempData ? (
                <Flex direction="column" gap={4} alignItems="center">
                  <img src={tempData} alt="Logo" style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '4px' }} />
                  <Button variant="danger-light" startIcon={<Trash />} onClick={() => setTempData('')}>Remove Logo</Button>
                </Flex>
              ) : (
                <Flex direction="column" gap={4} alignItems="center">
                  <Button variant="secondary" startIcon={<Plus />} onClick={() => setIsPickerOpen(true)}>
                    Select Logo
                  </Button>
                  <Typography variant="pi" textColor="neutral500">Pick from Media Library</Typography>
                </Flex>
              )}
            </Box>
          </Flex>
        );

      case 'collections':
        return (
          <Flex direction="column" gap={3}>
            {availableCollections.map((col) => {
              const isSelected = tempData.includes(col.uid);
              return (
                <Box
                  key={col.uid} padding={4} hasRadius background={isSelected ? "primary100" : "neutral0"}
                  as="button" type="button"
                  onClick={() => handleToggleCollection(col.uid)}
                  style={{ textAlign: 'left', border: isSelected ? '1px solid #4945ff' : '1px solid #4a4a6a', cursor: 'pointer', width: '100%' }}
                >
                  <Flex direction="column" alignItems="flex-start">
                    <Typography fontWeight="bold" textColor={isSelected ? "primary600" : "neutral800"}>{col.name}</Typography>
                    <Typography variant="pi" textColor="neutral500">{col.uid}</Typography>
                  </Flex>
                </Box>
              );
            })}
          </Flex>
        );

      default:
        return null;
    }
  };

  const titles: any = {
    key: "Manage API Key",
    domain: "Manage Base Domain",
    logo: isPickerOpen ? "Select Image" : "Manage Branding Logo",
    contact: "Manage Contact Link",
    collections: "Select Collections",
    suggestion: "Suggested Question",
    business: "Business Logic Configuration",
    style: "Response Style Configuration"
  };

  return (
    <Modal.Root open={isOpen} onOpenChange={onClose}>
      <Modal.Content>
        <Modal.Header><Typography fontWeight="bold" as="h2">{titles[type]}</Typography></Modal.Header>
        <Modal.Body>
          <Box paddingTop={2} paddingBottom={2}>{getModalContent()}</Box>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onClose} variant="tertiary">Cancel</Button>
          {!isPickerOpen && <Button onClick={() => { onSave(tempData); onClose(); }}>Apply Changes</Button>}
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export default PopUp;
