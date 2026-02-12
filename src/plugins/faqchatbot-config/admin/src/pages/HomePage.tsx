
// import React, { useEffect, useState } from 'react';
// import {
//   Main,
//   Typography,
//   Flex,
//   Button,
//   Box,
//   Checkbox,
//   Loader,
//   EmptyStateLayout,
//   Divider,
//   Accordion,
//   TextInput,
//   Grid,
//   Alert,
// } from '@strapi/design-system';
// import { Check, File, Key, Plus } from '@strapi/icons';

// // @ts-ignore
// import { useFetchClient, useNotification } from '@strapi/admin/strapi-admin';

// type FieldConfig = {
//   name: string;
//   enabled: boolean;
// };

// type CollectionConfig = {
//   name: string;
//   fields: FieldConfig[];
// };

// type CheckboxValue = boolean | 'indeterminate';

// const HomePage = () => {
//   const [items, setItems] = useState<CollectionConfig[]>([]);
//   const [openaiKey, setOpenaiKey] = useState('');
//   const [isApiVisible, setIsApiVisible] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);

//   const { get, post } = useFetchClient();
//   const { toggleNotification } = useNotification();

//   useEffect(() => {
//     const init = async () => {
//       try {
//         // Fetching both collections and existing config
//         const { data } = await get('/faqchatbot-config/collections');
//         // Assuming the endpoint returns an object with items and potentially the key
//         // Adjust if your GET endpoint structure is different
//         if (data.items && Array.isArray(data.items)) {
//           setItems(data.items);
//         } else if (Array.isArray(data)) {
//           setItems(data);
//         }
        
//         if (data.openaiKey) setOpenaiKey(data.openaiKey);

//       } catch {
//         toggleNotification({
//           type: 'warning',
//           message: 'Error loading configuration.',
//         });
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     init();
//   }, [get, toggleNotification]);

//   const toggleField = (collectionName: string, fieldName: string) => {
//     setItems((prev) =>
//       prev.map((c) => {
//         if (c.name !== collectionName) return c;
//         return {
//           ...c,
//           fields: c.fields.map((f) =>
//             f.name === fieldName ? { ...f, enabled: !f.enabled } : f
//           ),
//         };
//       })
//     );
//   };

//   const toggleAllFields = (collectionName: string, value: boolean) => {
//     setItems((prev) =>
//       prev.map((c) => {
//         if (c.name !== collectionName) return c;
//         return {
//           ...c,
//           fields: c.fields.map((f) => ({ ...f, enabled: value })),
//         };
//       })
//     );
//   };

//   const save = async () => {
//     setIsSaving(true);
//     try {
//       await post('/faqchatbot-config/collections', {
//         items,
//         openaiKey,
//       });
//       toggleNotification({
//         type: 'success',
//         message: 'Settings saved successfully!',
//       });
//       setIsApiVisible(false);
//     } catch {
//       toggleNotification({
//         type: 'warning',
//         message: 'Error saving settings.',
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <Flex justifyContent="center" alignItems="center" height="100vh">
//         <Loader>Loading configuration...</Loader>
//       </Flex>
//     );
//   }
  

//   return (
//     <Main>
//       {/* HEADER */}
//       <Box background="neutral100" padding={8} paddingBottom={6}>
//         <Flex justifyContent="space-between" alignItems="center">
//           <Box>
//             <Typography variant="beta" fontWeight="bold">
//               Realtime Configuration
//             </Typography>
//             <Typography variant="epsilon" textColor="neutral600">
//                Manage your AI search settings and API keys.
//             </Typography>
//           </Box>

//           <Button onClick={save} loading={isSaving} startIcon={<Check />}>
//             Save Settings
//           </Button>
//         </Flex>
//       </Box>

//       {/* BODY */}
//       <Box paddingLeft={8} paddingRight={8} paddingTop={0} background="neutral100">
        
//         {/* API CONFIGURATION BOX */}
//         <Box background="neutral0" shadow="filterShadow" hasRadius padding={6} marginBottom={6}>
//             <Flex justifyContent="space-between" alignItems="center">
//                 <Box>
//                     <Typography variant="delta" fontWeight="bold">API Configuration</Typography>
//                     <Typography variant="pi" textColor="neutral600" display="block">
//                         Configure your OpenAI credentials.
//                     </Typography>
//                 </Box>
//                 <Button
//                     variant="tertiary"
//                     startIcon={openaiKey ? <Key /> : <Plus />}
//                     onClick={() => setIsApiVisible(!isApiVisible)}
//                 >
//                     {openaiKey ? 'Change API Key' : 'Add API Key'}
//                 </Button>
//             </Flex>

//             {isApiVisible && (
//                 <Box paddingTop={4} style={{ borderTop: '1px solid #f0f0f5', marginTop: '16px' }}>
//                     <Grid.Root gap={4}>
//                         <Grid.Item col={6} s={12}>
//                             <TextInput
//                                 placeholder="sk-..."
//                                 label="OpenAI API Key"
//                                 name="openaiKey"
//                                 hint="Stored securely in your database."
//                                 type="password"
//                                 value={openaiKey}
//                                 onChange={(e: any) => setOpenaiKey(e.target.value)}
//                             />
//                         </Grid.Item>
//                     </Grid.Root>
//                 </Box>
//             )}
//         </Box>

//         {items.length === 0 ? (
//           <EmptyStateLayout
//             icon={<File width="6rem" height="6rem" />}
//             content="No collections found."
//           />
//         ) : (
//           <Box background="neutral0" shadow="filterShadow" hasRadius marginBottom={10}>
//             {/* SECTION TITLE */}
//             <Box padding={6} paddingBottom={0}>
//               <Typography variant="delta" fontWeight="bold">
//                 Permissions
//               </Typography>
//               <Box paddingTop={1} paddingBottom={3}>
//                 <Typography variant="pi" textColor="neutral600">
//                   Select the fields you want to expose to AI.
//                 </Typography>
//               </Box>
//             </Box>

//             {/* ACCORDION */}
//             <Accordion.Root type="multiple">
//               {items.map((c) => {
//                 const allChecked = c.fields.every((f) => f.enabled);
//                 const someChecked = c.fields.some((f) => f.enabled);

//                 return (
//                   <Accordion.Item key={c.name} value={c.name}>
//                     <Accordion.Header>
//                       <Accordion.Trigger>
//                         <Box paddingLeft={2} textAlign="left">
//                           <Typography variant="delta" fontWeight="bold" display="block">
//                             {c.name}
//                           </Typography>
//                           <Typography variant="pi" textColor="neutral600" display="block">
//                             Define all allowed fields for the {c.name} content type.
//                           </Typography>
//                         </Box>
//                       </Accordion.Trigger>
//                     </Accordion.Header>

//                     <Accordion.Content>
//                       <Box background="neutral100" padding={4}>
//                         <Flex justifyContent="space-between" alignItems="center" paddingBottom={2}>
//                           <Typography variant="sigma" textColor="neutral600">
//                             {c.name.toUpperCase()}
//                           </Typography>

//                           <Checkbox
//                             checked={allChecked}
//                             indeterminate={!allChecked && someChecked}
//                             onCheckedChange={(value: CheckboxValue) =>
//                               toggleAllFields(c.name, value === true)
//                             }
//                           >
//                             Select all
//                           </Checkbox>
//                         </Flex>

//                         <Divider marginBottom={3} />

//                         {/* FIELDS GRID - COMPACT STYLE */}
//                         <Box paddingTop={2}>
//                           <Flex gap={4} wrap="wrap" alignItems="center">
//                             {c.fields.map((f) => (
//                               <Box 
//                                 key={f.name} 
//                                 paddingRight={4} 
//                                 paddingBottom={2}
//                                 style={{ minWidth: '150px', flex: '0 0 auto' }}
//                               >
//                                 <Flex alignItems="center" gap={2}>
//                                   <Checkbox
//                                     checked={f.enabled}
//                                     onCheckedChange={() => toggleField(c.name, f.name)}
//                                   />
//                                   <Typography variant="omega" textColor="neutral800">
//                                     {f.name}
//                                   </Typography>
//                                 </Flex>
//                               </Box>
//                             ))}
//                           </Flex>
//                         </Box>
//                       </Box>
//                     </Accordion.Content>
//                   </Accordion.Item>
//                 );
//               })}
//             </Accordion.Root>
//           </Box>
//         )}
//       </Box>
//     </Main>
//   );
// };

// export { HomePage };
// import React, { useEffect, useState } from 'react';
// import {
//   Main,
//   Typography,
//   Flex,
//   Button,
//   Box,
//   Checkbox,
//   Loader,
//   EmptyStateLayout,
//   Divider,
//   Accordion,
//   TextInput,
//   Grid,
// } from '@strapi/design-system';
// import { Check, File, Key, Plus } from '@strapi/icons';

// // @ts-ignore
// import { useFetchClient, useNotification } from '@strapi/admin/strapi-admin';

// type FieldConfig = {
//   name: string;
//   enabled: boolean;
// };

// type CollectionConfig = {
//   name: string;
//   fields: FieldConfig[];
//   isPlugin?: boolean; // Keep this for grouping logic
// };

// type CheckboxValue = boolean | 'indeterminate';

// const HomePage = () => {
//   const [items, setItems] = useState<CollectionConfig[]>([]);
//   const [openaiKey, setOpenaiKey] = useState('');
//   const [isApiVisible, setIsApiVisible] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);

//   const { get, post } = useFetchClient();
//   const { toggleNotification } = useNotification();

//   useEffect(() => {
//     const init = async () => {
//       try {
//         const { data } = await get('/faqchatbot-config/collections');
        
//         // Handle both possible data structures from your endpoint
//         if (data.items && Array.isArray(data.items)) {
//           setItems(data.items);
//         } else if (Array.isArray(data)) {
//           setItems(data);
//         }
        
//         if (data.openaiKey) setOpenaiKey(data.openaiKey);
//       } catch {
//         toggleNotification({
//           type: 'warning',
//           message: 'Error loading configuration.',
//         });
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     init();
//   }, [get, toggleNotification]);

//   const toggleField = (collectionName: string, fieldName: string) => {
//     setItems((prev) =>
//       prev.map((c) => {
//         if (c.name !== collectionName) return c;
//         return {
//           ...c,
//           fields: c.fields.map((f) =>
//             f.name === fieldName ? { ...f, enabled: !f.enabled } : f
//           ),
//         };
//       })
//     );
//   };

//   const toggleAllFields = (collectionName: string, value: boolean) => {
//     setItems((prev) =>
//       prev.map((c) => {
//         if (c.name !== collectionName) return c;
//         return {
//           ...c,
//           fields: c.fields.map((f) => ({ ...f, enabled: value })),
//         };
//       })
//     );
//   };

//   const save = async () => {
//     setIsSaving(true);
//     try {
//       await post('/faqchatbot-config/collections', {
//         items,
//         openaiKey,
//       });
//       toggleNotification({
//         type: 'success',
//         message: 'Settings saved successfully!',
//       });
//       setIsApiVisible(false);
//     } catch {
//       toggleNotification({
//         type: 'warning',
//         message: 'Error saving settings.',
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <Flex justifyContent="center" alignItems="center" height="100vh">
//         <Loader>Loading configuration...</Loader>
//       </Flex>
//     );
//   }

//   // ✅ SEPARATE API & PLUGIN COLLECTIONS
//   const apiCollections = items.filter((c) => !c.isPlugin);
//   const pluginCollections = items.filter((c) => c.isPlugin);

//   const renderCollections = (list: CollectionConfig[]) => (
//     <Accordion.Root type="multiple">
//       {list.map((c) => {
//         const allChecked = c.fields.every((f) => f.enabled);
//         const someChecked = c.fields.some((f) => f.enabled);

//         return (
//           <Accordion.Item key={c.name} value={c.name}>
//             <Accordion.Header>
//               <Accordion.Trigger>
//                 <Box paddingLeft={2} textAlign="left">
//                   <Typography variant="delta" fontWeight="bold" display="block">
//                     {c.name}
//                   </Typography>
//                   <Typography variant="pi" textColor="neutral600" display="block">
//                     Define all allowed fields for the {c.name} content type.
//                   </Typography>
//                 </Box>
//               </Accordion.Trigger>
//             </Accordion.Header>

//             <Accordion.Content>
//               <Box background="neutral100" padding={4}>
//                 <Flex justifyContent="space-between" alignItems="center" paddingBottom={2}>
//                   <Typography variant="sigma" textColor="neutral600">
//                     {c.name.toUpperCase()}
//                   </Typography>

//                   <Checkbox
//                     checked={allChecked}
//                     indeterminate={!allChecked && someChecked}
//                     onCheckedChange={(value: CheckboxValue) =>
//                       toggleAllFields(c.name, value === true)
//                     }
//                   >
//                     Select all
//                   </Checkbox>
//                 </Flex>

//                 <Divider marginBottom={3} />

//                 {/* FIELDS GRID - COMPACT MINIMIZED GAP */}
//                 <Box paddingTop={2}>
//                   <Flex gap={2} wrap="wrap" alignItems="center">
//                     {c.fields.map((f) => (
//                       <Box 
//                         key={f.name} 
//                         paddingRight={2} 
//                         paddingBottom={2}
//                         style={{ minWidth: '140px', flex: '0 0 auto' }}
//                       >
//                         <Flex alignItems="center" gap={2}>
//                           <Checkbox
//                             checked={f.enabled}
//                             onCheckedChange={() => toggleField(c.name, f.name)}
//                           />
//                           <Typography variant="omega" textColor="neutral800">
//                             {f.name}
//                           </Typography>
//                         </Flex>
//                       </Box>
//                     ))}
//                   </Flex>
//                 </Box>
//               </Box>
//             </Accordion.Content>
//           </Accordion.Item>
//         );
//       })}
//     </Accordion.Root>
//   );

//   return (
//     <Main>
//       {/* HEADER */}
//       <Box background="neutral100" padding={8} paddingBottom={6}>
//         <Flex justifyContent="space-between" alignItems="center">
//           <Box>
//             <Typography variant="beta" fontWeight="bold">
//               Realtime Configuration
//             </Typography>
//             <Typography variant="epsilon" textColor="neutral600">
//               Manage your AI search settings and API keys.
//             </Typography>
//           </Box>

//           <Button onClick={save} loading={isSaving} startIcon={<Check />}>
//             Save Settings
//           </Button>
//         </Flex>
//       </Box>

//       {/* BODY */}
//       <Box paddingLeft={8} paddingRight={8} paddingTop={0} background="neutral100">
        
//         {/* API CONFIGURATION BOX */}
//         <Box background="neutral0" shadow="filterShadow" hasRadius padding={6} marginBottom={6}>
//           <Flex justifyContent="space-between" alignItems="center">
//             <Box>
//               <Typography variant="delta" fontWeight="bold">API Configuration</Typography>
//               <Typography variant="pi" textColor="neutral600" display="block">
//                 Configure your OpenAI credentials.
//               </Typography>
//             </Box>
//             <Button
//               variant="tertiary"
//               startIcon={openaiKey ? <Key /> : <Plus />}
//               onClick={() => setIsApiVisible(!isApiVisible)}
//             >
//               {openaiKey ? 'Change API Key' : 'Add API Key'}
//             </Button>
//           </Flex>

//           {isApiVisible && (
//             <Box paddingTop={4} style={{ borderTop: '1px solid #f0f0f5', marginTop: '16px' }}>
//               <Grid.Root gap={4}>
//                 <Grid.Item col={6} s={12}>
//                   <TextInput
//                     placeholder="sk-..."
//                     label="OpenAI API Key"
//                     name="openaiKey"
//                     hint="Stored securely in your database."
//                     type="password"
//                     value={openaiKey}
//                     onChange={(e: any) => setOpenaiKey(e.target.value)}
//                   />
//                 </Grid.Item>
//               </Grid.Root>
//             </Box>
//           )}
//         </Box>

//         {items.length === 0 ? (
//           <EmptyStateLayout
//             icon={<File width="6rem" height="6rem" />}
//             content="No collections found."
//           />
//         ) : (
//           <Box background="neutral0" shadow="filterShadow" hasRadius marginBottom={10}>
//             {/* CONTENT TYPES SECTION */}
//             <Box padding={6} paddingBottom={2}>
//               <Typography variant="delta" fontWeight="bold">
//                 Content Types
//               </Typography>
//               <Typography variant="pi" textColor="neutral600" display="block">
//                 Regular API collections.
//               </Typography>
//             </Box>

//             {renderCollections(apiCollections)}

//             {/* PLUGIN COLLECTIONS SECTION */}
//             {pluginCollections.length > 0 && (
//               <>
//                 <Divider marginTop={4} />
//                 <Box padding={6} paddingBottom={2}>
//                   <Typography variant="delta" fontWeight="bold">
//                     Chatbot FAQ
//                   </Typography>
//                   <Typography variant="pi" textColor="neutral600" display="block">
//                     Plugin-based FAQ collections.
//                   </Typography>
//                 </Box>
//                 {renderCollections(pluginCollections)}
//               </>
//             )}
//           </Box>
//         )}
//       </Box>
//     </Main>
//   );
// };

// export { HomePage };


import React, { useEffect, useState } from 'react';
import {
  Main,
  Typography,
  Flex,
  Button,
  Box,
  Checkbox,
  Loader,
  EmptyStateLayout,
  Divider,
  Accordion,
  TextInput,
  Grid,
} from '@strapi/design-system';
import { Check, File, Key, Plus } from '@strapi/icons';


import { useFetchClient, useNotification } from '@strapi/admin/strapi-admin';

type FieldConfig = {
  name: string;
  enabled: boolean;
};

type CollectionConfig = {
  name: string;
  fields: FieldConfig[];
  isPlugin?: boolean;
};

type CheckboxValue = boolean | 'indeterminate';

const HomePage = () => {
  const [items, setItems] = useState<CollectionConfig[]>([]);
  const [openaiKey, setOpenaiKey] = useState('');
  const [isApiVisible, setIsApiVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await get('/faqchatbot-config/collections');

        if (data.items && Array.isArray(data.items)) {
          setItems(data.items);
        } else if (Array.isArray(data)) {
          setItems(data);
        }

        if (data.openaiKey) setOpenaiKey(data.openaiKey);
      } catch {
        toggleNotification({
          type: 'warning',
          message: 'Error loading configuration.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [get, toggleNotification]);

  const toggleField = (collectionName: string, fieldName: string) => {
    setItems((prev) =>
      prev.map((c) => {
        if (c.name !== collectionName) return c;
        return {
          ...c,
          fields: c.fields.map((f) =>
            f.name === fieldName ? { ...f, enabled: !f.enabled } : f
          ),
        };
      })
    );
  };

  const toggleAllFields = (collectionName: string, value: boolean) => {
    setItems((prev) =>
      prev.map((c) => {
        if (c.name !== collectionName) return c;
        return {
          ...c,
          fields: c.fields.map((f) => ({ ...f, enabled: value })),
        };
      })
    );
  };

  const save = async () => {
    setIsSaving(true);
    try {
      await post('/faqchatbot-config/collections', {
        items,
        openaiKey,
      });
      toggleNotification({
        type: 'success',
        message: 'Settings saved successfully!',
      });
      setIsApiVisible(false);
    } catch {
      toggleNotification({
        type: 'warning',
        message: 'Error saving settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="100vh">
        <Loader>Loading configuration...</Loader>
      </Flex>
    );
  }

  // ✅ SPLIT COLLECTIONS
  const apiCollections = items.filter((c) => !c.isPlugin);
  const pluginCollections = items.filter((c) => c.isPlugin);

  const renderCollections = (list: CollectionConfig[]) => (
    <Accordion.Root type="multiple">
      {list.map((c) => {
        const allChecked = c.fields.every((f) => f.enabled);
        const someChecked = c.fields.some((f) => f.enabled);

        return (
          <Accordion.Item key={c.name} value={c.name}>
            <Accordion.Header>
              <Accordion.Trigger>
                <Box paddingLeft={2} textAlign="left">
                  <Typography variant="delta" fontWeight="bold" display="block">
                    {c.name}
                  </Typography>
                  <Typography variant="pi" textColor="neutral600">
                    Define all allowed fields for the {c.name} content type.
                  </Typography>
                </Box>
              </Accordion.Trigger>
            </Accordion.Header>

            <Accordion.Content>
              <Box background="neutral100" padding={4}>
                <Flex justifyContent="space-between" alignItems="center" paddingBottom={2}>
                  <Typography variant="sigma" textColor="neutral600">
                    {c.name.toUpperCase()}
                  </Typography>

                  <Checkbox
                    checked={allChecked}
                    indeterminate={!allChecked && someChecked}
                    onCheckedChange={(value: CheckboxValue) =>
                      toggleAllFields(c.name, value === true)
                    }
                  >
                    Select all
                  </Checkbox>
                </Flex>

                <Divider marginBottom={3} />

                {/* COMPACT FIELD LAYOUT */}
                <Box paddingTop={2}>
                  <Flex gap={2} wrap="wrap">
                    {c.fields.map((f) => (
                      <Box
                        key={f.name}
                        paddingRight={2}
                        paddingBottom={1}
                        style={{ minWidth: '140px' }}
                      >
                        <Flex alignItems="center" gap={2}>
                          <Checkbox
                            checked={f.enabled}
                            onCheckedChange={() =>
                              toggleField(c.name, f.name)
                            }
                          />
                          <Typography variant="omega">
                            {f.name}
                          </Typography>
                        </Flex>
                      </Box>
                    ))}
                  </Flex>
                </Box>
              </Box>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );

  return (
    <Main>
      {/* HEADER */}
      <Box background="neutral100" padding={8} paddingBottom={6}>
        <Flex justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="beta" fontWeight="bold">
              Realtime Configuration
            </Typography>
            
          </Box>

          <Button onClick={save} loading={isSaving} startIcon={<Check />}>
            Save Settings
          </Button>
        </Flex>
      </Box>

      {/* BODY */}
      <Box paddingLeft={8} paddingRight={8} background="neutral100">

        {/* API CONFIGURATION BOX */}
        <Box background="neutral0" shadow="filterShadow" hasRadius padding={6} marginBottom={6}>
          <Flex justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="delta" fontWeight="bold">
                API Configuration
              </Typography>
             
            </Box>
            <Button
              variant="tertiary"
              startIcon={openaiKey ? <Key /> : <Plus />}
              onClick={() => setIsApiVisible(!isApiVisible)}
            >
              {openaiKey ? 'Change API Key' : 'Add API Key'}
            </Button>
          </Flex>

          {isApiVisible && (
            <Box paddingTop={4} style={{ borderTop: '1px solid #f0f0f5', marginTop: '16px' }}>
              <Grid.Root gap={4}>
                <Grid.Item col={6} s={12}>
                  <TextInput
                    placeholder="sk-..."
                    label="OpenAI API Key"
                    name="openaiKey"
                    type="password"
                    value={openaiKey}
                    onChange={(e: any) => setOpenaiKey(e.target.value)}
                  />
                </Grid.Item>
              </Grid.Root>
            </Box>
          )}
        </Box>

        {/* COLLECTIONS BOX */}
        <Box background="neutral0" shadow="filterShadow" hasRadius paddingBottom={4}>
          <Box padding={6} paddingBottom={2}>
            <Typography variant="delta" fontWeight="bold">
              Collections
            </Typography>
          </Box>

          {renderCollections(apiCollections)}
        </Box>

        {/* ✅ GAP LIKE STRAPI */}
        <Box marginTop={6} />

        {/* ✅ SEPARATE CHATBOT FAQ BOX */}
        {pluginCollections.length > 0 && (
          <Box background="neutral0" shadow="filterShadow" hasRadius paddingBottom={4}>
            <Box padding={6} paddingBottom={2}>
              <Typography variant="delta" fontWeight="bold">
                Chatbot FAQ
              </Typography>
            
            </Box>

            {renderCollections(pluginCollections)}
          </Box>
        )}
      </Box>
    </Main>
  );
};

export { HomePage };

