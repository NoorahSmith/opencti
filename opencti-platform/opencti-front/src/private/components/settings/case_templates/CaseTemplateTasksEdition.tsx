import { Field, Form, Formik } from 'formik';
import { graphql, useMutation } from 'react-relay';
import React from 'react';
import * as Yup from 'yup';
import { useFormatter } from '../../../../components/i18n';
import MarkDownField from '../../../../components/MarkDownField';
import TextField from '../../../../components/TextField';
import { fieldSpacingContainerStyle } from '../../../../utils/field';
import { useSchemaEditionValidation } from '../../../../utils/hooks/useEntitySettings';
import { Option } from '../../common/form/ReferenceField';
import { CaseTemplateTasksLine_node$data } from './__generated__/CaseTemplateTasksLine_node.graphql';

const caseTemplateMutationFieldPatch = graphql`
    mutation CaseTemplateTasksEditionFieldPatchMutation($id: ID!$input: [EditInput!]!) {
        taskTemplateFieldPatch(id: $id, input: $input) {
            ...CaseTemplateTasksLine_node
        }
    }
`;

const CaseTemplateTasksEdition = ({ task }: { task: CaseTemplateTasksLine_node$data }) => {
  const { t } = useFormatter();

  const basicShape = {
    name: Yup.string().min(2).required(t('This field is required')),
    description: Yup.string().nullable().max(5000, t('The value is too long')),
  };
  const taskValidator = useSchemaEditionValidation('Task', basicShape);
  const [commitFieldPatch] = useMutation(caseTemplateMutationFieldPatch);
  const onSubmit = (name: string, value: Option | Option[] | string) => {
    taskValidator
      .validateAt(name, { [name]: value })
      .then(() => {
        commitFieldPatch({
          variables: {
            id: task.id,
            input: [{ key: name, value: Array.isArray(value) ? value.map((o) => o.value) : [value ?? ''] }],
          },
        });
      })
      .catch(() => false);
  };
  return (
    <Formik
      initialValues={task}
      onSubmit={() => {
      }}
      validationSchema={taskValidator}
    >
      {() => (
        <Form style={{ margin: '20px 0 20px 0' }}>
          <Field
            style={{ marginBottom: 20 }}
            component={TextField}
            variant="standard"
            name="name"
            label={t('Name')}
            fullWidth={true}
            onSubmit={onSubmit}
          />
          <Field
            component={MarkDownField}
            name="description"
            label={t('Description')}
            fullWidth={true}
            multiline={true}
            rows="4"
            style={fieldSpacingContainerStyle}
            onSubmit={onSubmit}
          />

        </Form>
      )}
    </Formik>
  );
};

export default CaseTemplateTasksEdition;
