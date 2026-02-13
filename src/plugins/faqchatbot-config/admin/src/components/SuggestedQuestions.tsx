import React from 'react';
import styled from 'styled-components';
import { Box, Typography, Flex, Button } from '@strapi/design-system';
import { Plus, Trash, Pencil } from '@strapi/icons';

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 32px;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.neutral600};
  transition: background 0.2s;
  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.neutral150}; color: ${({ theme }) => theme.colors.neutral800}; }
  svg { width: 12px; height: 12px; }
`;

const DangerActionButton = styled(ActionButton)`
  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.danger100}; color: ${({ theme }) => theme.colors.danger600}; }
`;

interface SuggestedQuestionsProps {
  questions: string[];
  onAddClick: () => void;
  onEditClick: (index: number) => void;
  onRemove: (index: number) => void;
}

const SuggestedQuestions = ({ questions, onAddClick, onEditClick, onRemove }: SuggestedQuestionsProps) => {
  return (
    <Box background="neutral0" shadow="filterShadow" hasRadius paddingBottom={questions.length > 0 ? 4 : 0} marginBottom={6}>
      <Box padding={6}>
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="delta" fontWeight="bold">Suggested Questions</Typography>
          <Button variant="secondary" startIcon={<Plus />} onClick={onAddClick}>
            Add Suggestion
          </Button>
        </Flex>
      </Box>

      {questions.length > 0 && (
        <Flex direction="column" alignItems="stretch" gap={2} paddingLeft={6} paddingRight={6} paddingBottom={4}>
          {questions.map((q, index) => (
            <Flex key={index} padding={3} hasRadius background="neutral100" justifyContent="space-between" alignItems="center">
              <Typography variant="omega" textColor="neutral800">{q}</Typography>
              <Flex gap={1}>
                <ActionButton onClick={() => onEditClick(index)} title="Edit"><Pencil /></ActionButton>
                <DangerActionButton onClick={() => onRemove(index)} title="Remove"><Trash /></DangerActionButton>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}
    </Box>
  );
};

export default SuggestedQuestions;
