import React from 'react';
import styled from 'styled-components';
import {
  Box,
  Typography,
  Flex,
  Checkbox,
  Divider,
  Accordion,
  Button,
  SingleSelect,
  SingleSelectOption
} from '@strapi/design-system';
import { Plus, Trash } from '@strapi/icons';


const DeleteButton = styled(Button)`
  &:hover {
    background: ${({ theme }) => theme.colors.danger100} !important;
    svg {
      fill: ${({ theme }) => theme.colors.danger600} !important;
    }
  }
`;

interface FieldConfig {
  name: string;
  enabled: boolean;
}

interface CollectionConfig {
  uid: string;
  name: string;
  fields: FieldConfig[];
  cardStyle?: string;
}

interface CollectionSectionProps {
  collections: CollectionConfig[];
  onToggleField: (uid: string, fieldName: string) => void;
  onToggleAll: (uid: string, value: boolean) => void;
  cardOptions: { id: string; label: string }[];
  onRemoveCollection: (uid: string) => void;
  onUpdateCardStyle: (uid: string, style: string) => void;
  onAddClick: () => void;
  isAddDisabled?: boolean;
}

const CollectionSection: React.FC<CollectionSectionProps> = ({
  collections,
  onToggleField,
  onToggleAll,
  cardOptions,
  onRemoveCollection,
  onUpdateCardStyle,
  onAddClick,
  isAddDisabled = false
}) => {
  return (
    <Box background="neutral0" shadow="filterShadow" hasRadius paddingBottom={collections.length > 0 ? 4 : 0} marginBottom={6}>
      <Box padding={6}>
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="delta" fontWeight="bold">
            Collections
          </Typography>
          <Button
            variant="secondary"
            startIcon={<Plus />}
            onClick={onAddClick}
            disabled={isAddDisabled}
          >
            Add Collection
          </Button>
        </Flex>
      </Box>

      {collections.length > 0 && (
        <Accordion.Root type="multiple">
          {collections.map((c) => {
            const allChecked = c.fields.every((f) => f.enabled);
            const someChecked = c.fields.some((f) => f.enabled);

            return (
              <Accordion.Item key={c.uid} value={c.uid}>
                <Accordion.Header>
                  <Accordion.Trigger>
                    <Box paddingLeft={2} textAlign="left">
                      <Typography variant="delta" fontWeight="bold" display="block">
                        {c.name}
                      </Typography>
                      <Typography variant="pi" textColor="neutral600">
                        Define all allowed fields for {c.name}.
                      </Typography>
                    </Box>
                  </Accordion.Trigger>

                  <Box paddingRight={4}>

                    <DeleteButton
                      variant="ghost"
                      title="Remove"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onRemoveCollection(c.uid);
                      }}
                      style={{ padding: '8px' }}
                    >
                      <Trash width="16px" height="16px" />
                    </DeleteButton>
                  </Box>
                </Accordion.Header>

                <Accordion.Content>
                  <Box background="neutral100" padding={4}>
                    <Flex justifyContent="space-between" alignItems="center" paddingBottom={2}>
                      <Typography variant="sigma" textColor="neutral600">
                        {c.name.toUpperCase()} FIELDS
                      </Typography>
                      <Checkbox
                        checked={allChecked}
                        indeterminate={!allChecked && someChecked}
                        onCheckedChange={(value: any) => onToggleAll(c.uid, !!value)}
                      >
                        Select all
                      </Checkbox>
                    </Flex>
                    <Divider marginBottom={3} />
                    <Box paddingTop={2} paddingBottom={4}>
                      <Flex gap={4} wrap="wrap">
                        {c.fields.map((f) => (
                          <Box key={f.name} style={{ minWidth: '140px' }}>
                            <Flex alignItems="center" gap={2}>
                              <Checkbox
                                checked={f.enabled}
                                onCheckedChange={() => onToggleField(c.uid, f.name)}
                              />
                              <Typography variant="omega">{f.name}</Typography>
                            </Flex>
                          </Box>
                        ))}
                      </Flex>
                    </Box>

                    <Box paddingTop={4}>
                        <Typography variant="sigma" textColor="neutral600" display="block" marginBottom={2}>
                            CARD STYLES
                        </Typography>
                        <Divider marginBottom={4} />
                        <Box width="300px">
                            <SingleSelect
                                label="Select Card Style"
                                placeholder="Select card"
                                value={c.cardStyle}
                                onChange={(value: string) => onUpdateCardStyle(c.uid, value)}
                            >
                                {cardOptions.map((c) => (
                                  <SingleSelectOption key={c.id} value={c.id}>
                                    {c.label}
                                  </SingleSelectOption>
                                ))}
                            </SingleSelect>
                        </Box>
                    </Box>
                  </Box>
                </Accordion.Content>
              </Accordion.Item>
            );
          })}
        </Accordion.Root>
      )}
    </Box>
  );
};

export default CollectionSection;
