import React from 'react';
import { Box, Flex, Typography, Button, Divider } from '@strapi/design-system';

interface ConfigSettingsProps {
  openaiKey: string;
  logoUrl: string;
  baseDomain: string;
  contactLink: string;
  onManage: (type: 'key' | 'logo' | 'domain' | 'contact') => void;
}

const ConfigSettings = ({
  openaiKey,
  logoUrl,
  baseDomain,
  contactLink,
  onManage
}: ConfigSettingsProps) => {

const SettingRow = ({
  title,
  value,
  type
}: {
  title: string,
  value: string,
  type: 'key' | 'logo' | 'domain' | 'contact'
}) => (
  <Box paddingLeft={6} paddingRight={6} paddingTop={4} paddingBottom={4}>
    <Flex justifyContent="space-between" alignItems="center">
      <Typography variant="omega" fontWeight="bold">{title}</Typography>

      <Flex gap={3} alignItems="center">
          {value ? (
              /* DISPLAY VALUE WITHOUT BACKGROUND */
              <Box
                  style={{
                      maxWidth: '250px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                  }}
              >
                  <Typography variant="pi" textColor="neutral600">
                      {type === 'key' ? '••••••••••••' : value}
                  </Typography>
              </Box>
          ) : (

              <Typography variant="sigma" textColor="danger600" fontWeight="bold">
                  NOT CONFIGURED
              </Typography>
          )}

          <Button variant="tertiary" onClick={() => onManage(type)}>
              Manage
          </Button>
      </Flex>
    </Flex>
  </Box>
);

  return (
    <Box background="neutral0" shadow="filterShadow" hasRadius marginBottom={6}>
      <SettingRow
        type="domain"
        title="Base Domain"
        value={baseDomain}
      />
      <Divider />
      <SettingRow
        type="key"
        title="OpenAI API Key"
        value={openaiKey}
      />
      <Divider />
      <SettingRow
        type="logo"
        title="Chatbot Branding Logo"
        value={logoUrl}
      />
      <Divider />
      <SettingRow
        type="contact"
        title="Organization Contact Link"
        value={contactLink}
      />
    </Box>
  );
};

export default ConfigSettings;
