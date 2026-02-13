import React, { useState } from 'react';
import { Box, Typography, Flex, Button, Divider, Textarea } from '@strapi/design-system';

const InstructionRow = ({
  title,
  value,
  isOpen,
  onToggle,
  onChange,
  placeholder
}: {
  title: string;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (val: string) => void;
  placeholder: string;
}) => (
  <>
    <Box paddingLeft={6} paddingRight={6} paddingTop={4} paddingBottom={4}>
      <Flex justifyContent="space-between" alignItems="center">
        <Typography variant="omega" fontWeight="bold">
          {title}
        </Typography>

        <Flex gap={3} alignItems="center">

          {!value && !isOpen && (
            <Typography variant="sigma" textColor="danger600" fontWeight="bold">
              NOT CONFIGURED
            </Typography>
          )}

          <Button variant="tertiary" onClick={onToggle}>
            {isOpen ? 'Apply' : 'Manage'}
          </Button>
        </Flex>
      </Flex>
    </Box>

    {isOpen && (
      <Box paddingLeft={6} paddingRight={6} paddingBottom={6} background="neutral0">
        <Box paddingTop={2}>
          <Textarea
            placeholder={placeholder}
            value={value}
            onChange={(e: any) => onChange(e.target.value)}
            style={{ minHeight: '150px' }}
          />
        </Box>
      </Box>
    )}
  </>
);

interface InstructionsSectionProps {
  systemInstructions: string;
  responseInstructions: string;
  onUpdateSystem: (val: string) => void;
  onUpdateResponse: (val: string) => void;
}

const InstructionsSection = ({
  systemInstructions,
  responseInstructions,
  onUpdateSystem,
  onUpdateResponse
}: InstructionsSectionProps) => {
  const [isSystemOpen, setIsSystemOpen] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);

  return (
    <Box background="neutral0" shadow="filterShadow" hasRadius marginBottom={6}>
      <Box
        padding={6}
        borderColor="neutral150"
        borderStyle="solid"
        borderWidth="0 0 1px 0"
      >
        <Typography variant="delta" fontWeight="bold">Instructions</Typography>
      </Box>

      <InstructionRow
        title="System Instructions"
        value={systemInstructions}
        isOpen={isSystemOpen}
        onToggle={() => setIsSystemOpen(!isSystemOpen)}
        onChange={onUpdateSystem}
        placeholder="Define the chatbot knowledge and persona..."
      />

      <Divider />

      <InstructionRow
        title="Response Instructions"
        value={responseInstructions}
        isOpen={isResponseOpen}
        onToggle={() => setIsResponseOpen(!isResponseOpen)}
        onChange={onUpdateResponse}
        placeholder="Define formatting, tone, and language..."
      />
    </Box>
  );
};

export default InstructionsSection;
