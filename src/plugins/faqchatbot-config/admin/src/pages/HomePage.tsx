import React, { useEffect, useState } from 'react';
import { Main, Typography, Flex, Button, Box, Loader } from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { useFetchClient, useNotification } from '@strapi/admin/strapi-admin';

import ChatbotPreview from '../components/ChatbotPreview';
import ConfigSettings from '../components/ConfigSettings';
import CollectionSection from '../components/CollectionSection';
import SuggestedQuestions from '../components/SuggestedQuestions';
import InstructionsSection from '../components/InstructionsSection';
import PopUp from '../components/PopUp';

type FieldConfig = {
  name: string;
  enabled: boolean;
};

type CollectionConfig = {
  uid: string;
  name: string;
  fields: FieldConfig[];
  cardStyle?: string;
};

const HomePage = () => {
  // Data States
  const [allContentTypes, setAllContentTypes] = useState<CollectionConfig[]>([]);
  const [activeCollections, setActiveCollections] = useState<CollectionConfig[]>([]);

  // Settings States
  const [openaiKey, setOpenaiKey] = useState('');
  const [systemInstructions, setSystemInstructions] = useState('');
  const [responseInstructions, setResponseInstructions] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [baseDomain, setBaseDomain] = useState('');
  const [contactLink, setContactLink] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [cardOptions, setCardOptions] = useState<any[]>([]);


  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeModal, setActiveModal] = useState<'key' | 'logo' | 'domain' | 'contact' | 'collections' | 'suggestion' |  null>(null);

  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();


  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await get('/faqchatbot-config/collections');
        const settings = data.settings || {};
        const savedConfig = settings.config || {};
        const savedStyles = settings.cardStyles || {}; // Added from friend's update

        // Set Settings from Database
        setOpenaiKey(settings.openaiKey || '');
        setSystemInstructions(settings.systemInstructions || '');
        setResponseInstructions(settings.responseInstructions || '');
        setLogoUrl(settings.logoUrl || '');
        setBaseDomain(settings.baseDomain || '');

        if (settings.baseDomain) {
          fetch(`${settings.baseDomain}/card-mapping.json`)
            .then(res => res.json())
            .then(setCardOptions)
            .catch(() => setCardOptions([]));
        }

        setContactLink(settings.contactLink || '');
        setSuggestedQuestions(settings.suggestedQuestions || []);

        const formattedAll: CollectionConfig[] = (data.contentTypes || []).map((ct: any) => ({
          uid: ct.uid,
          name: ct.displayName,
          cardStyle: savedStyles[ct.uid] || undefined, // Added from friend's update
          fields: ct.attributes.map((attr: any) => ({
            name: attr.name,
            enabled: savedConfig[ct.uid]?.includes(attr.name) || false
          }))
        }));

        setAllContentTypes(formattedAll);

        // Set Active Collections
        const initialActive = formattedAll.filter((ct: CollectionConfig) =>
            Object.keys(savedConfig).includes(ct.uid)
        );
        setActiveCollections(initialActive);

      } catch (err) {
        toggleNotification({ type: 'warning', message: 'Error loading configuration.' });
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [get]);


  const handleUpdateCardStyle = (uid: string, style: string) => {
    setActiveCollections((prev) => prev.map((c) =>
      c.uid === uid ? { ...c, cardStyle: style } : c
    ));
  };

  const handleRemoveCollection = (uid: string) => {
    setActiveCollections((prev) => prev.filter(c => c.uid !== uid));
  };

  // --- Logic for Modals ---
  const handlePopupSave = (data: any) => {
    if (activeModal === 'collections') {
      const selectedUids = data as string[];
      setActiveCollections((currentActive) => {
        const remaining = currentActive.filter(c => selectedUids.includes(c.uid));
        const currentUids = currentActive.map(c => c.uid);
        const newUids = selectedUids.filter(uid => !currentUids.includes(uid));
        const newlyAdded = allContentTypes
          .filter(ct => selectedUids.includes(ct.uid) && !currentUids.includes(ct.uid))
          .map(ct => JSON.parse(JSON.stringify(ct)));
        return [...remaining, ...newlyAdded];
      });
    }
    else if (activeModal === 'suggestion') {
      setSuggestedQuestions((prev) => {
        const newList = [...prev];
        if (editingQuestionIndex !== null) newList[editingQuestionIndex] = data;
        else newList.push(data);
        return newList;
      });
      setEditingQuestionIndex(null);
    }
    else if (activeModal === 'key') setOpenaiKey(data);
    else if (activeModal === 'domain') setBaseDomain(data);
    else if (activeModal === 'logo') setLogoUrl(data);
    else if (activeModal === 'contact') setContactLink(data);

    setActiveModal(null);
  };

  // Save Logic
  const save = async () => {
    setIsSaving(true);
    try {
      const configToSave: Record<string, string[]> = {};
      const stylesToSave: Record<string, string> = {}; // Added from friend's update

      activeCollections.forEach(item => {
        const enabled = item.fields.filter(f => f.enabled).map(f => f.name);
        if (enabled.length > 0) configToSave[item.uid] = enabled;
        if (item.cardStyle) stylesToSave[item.uid] = item.cardStyle; // Added from friend's update
      });

      await post('/faqchatbot-config/collections', {
        config: configToSave,
        cardStyles: stylesToSave,
        openaiKey, systemInstructions, responseInstructions,
        logoUrl, baseDomain, contactLink, suggestedQuestions
      });

      toggleNotification({ type: 'success', message: 'Settings saved successfully!' });
    } catch {
      toggleNotification({ type: 'warning', message: 'Error saving settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Flex justifyContent="center" height="100vh"><Loader /></Flex>;

  return (
    <Main>
      <Box background="neutral100" position="sticky" top={0} zIndex={2} padding={8} paddingBottom={6}>
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="beta" fontWeight="bold">Chatbot Configuration</Typography>
          <Button onClick={save} loading={isSaving} startIcon={<Check />}>Save Settings</Button>
        </Flex>
      </Box>

      <Box paddingLeft={8} paddingTop={2} paddingRight={8} background="neutral100">
        <ConfigSettings
            baseDomain={baseDomain} openaiKey={openaiKey} logoUrl={logoUrl}
            contactLink={contactLink} onManage={(type: any) => setActiveModal(type)}
        />

        <CollectionSection
          collections={activeCollections}
          cardOptions={cardOptions}
          onToggleField={(uid, fName) => {
            setActiveCollections(prev => prev.map(c => c.uid !== uid ? c : {
              ...c, fields: c.fields.map((f: FieldConfig) => f.name === fName ? { ...f, enabled: !f.enabled } : f)
            }));
          }}
          onToggleAll={(uid, val) => {
            setActiveCollections(prev => prev.map(c => c.uid !== uid ? c : {
              ...c, fields: c.fields.map((f: FieldConfig) => ({ ...f, enabled: val }))
            }));
          }}
          onRemoveCollection={handleRemoveCollection}
          onUpdateCardStyle={handleUpdateCardStyle}
          onAddClick={() => setActiveModal('collections')}
          isAddDisabled={allContentTypes.filter(c => c.uid !== 'plugin::faqchatbot-config.faqqa').length === activeCollections.length
  }
        />


        <SuggestedQuestions
          questions={suggestedQuestions}
          onAddClick={() => { setEditingQuestionIndex(null); setActiveModal('suggestion'); }}
          onEditClick={(index) => { setEditingQuestionIndex(index); setActiveModal('suggestion'); }}
          onRemove={(index) => { setSuggestedQuestions(prev => prev.filter((_, i) => i !== index)); }}
        />



        <InstructionsSection
          systemInstructions={systemInstructions}
          responseInstructions={responseInstructions}
          onUpdateSystem={setSystemInstructions}
          onUpdateResponse={setResponseInstructions}
        />
      </Box>

      <PopUp
        isOpen={!!activeModal} type={activeModal} onClose={() => setActiveModal(null)} onSave={handlePopupSave}

        availableCollections={allContentTypes.filter(c =>
          c.uid !== 'plugin::faqchatbot-config.faqqa' &&
          !activeCollections.some(active => active.uid === c.uid)
        )}
        initialData={
            activeModal === 'collections' ? activeCollections.map(c => c.uid) :
            activeModal === 'suggestion' ? (editingQuestionIndex !== null ? suggestedQuestions[editingQuestionIndex] : ''):
            activeModal === 'key' ? openaiKey :
            activeModal === 'domain' ? baseDomain :
            activeModal === 'logo' ? logoUrl : contactLink
        }
      />

      <ChatbotPreview />
    </Main>
  );
};

export { HomePage };
