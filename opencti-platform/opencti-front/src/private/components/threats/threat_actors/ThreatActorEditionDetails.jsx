import React from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import * as Yup from 'yup';
import * as R from 'ramda';
import { Field, Form, Formik } from 'formik';
import { useFormatter } from '../../../../components/i18n';
import TextField from '../../../../components/TextField';
import { SubscriptionFocus } from '../../../../components/Subscription';
import { commitMutation } from '../../../../relay/environment';
import OpenVocabField from '../../common/form/OpenVocabField';
import { buildDate, parse } from '../../../../utils/Time';
import CommitMessage from '../../common/form/CommitMessage';
import { adaptFieldValue } from '../../../../utils/String';
import DateTimePickerField from '../../../../components/DateTimePickerField';
import { fieldSpacingContainerStyle } from '../../../../utils/field';

const threatActorMutationFieldPatch = graphql`
  mutation ThreatActorEditionDetailsFieldPatchMutation(
    $id: ID!
    $input: [EditInput]!
    $commitMessage: String
    $references: [String]
  ) {
    threatActorEdit(id: $id) {
      fieldPatch(
        input: $input
        commitMessage: $commitMessage
        references: $references
      ) {
        ...ThreatActorEditionDetails_threatActor
        ...ThreatActor_threatActor
      }
    }
  }
`;

const threatActorEditionDetailsFocus = graphql`
  mutation ThreatActorEditionDetailsFocusMutation(
    $id: ID!
    $input: EditContext!
  ) {
    threatActorEdit(id: $id) {
      contextPatch(input: $input) {
        id
      }
    }
  }
`;

const threatActorValidation = (t) => Yup.object().shape({
  first_seen: Yup.date()
    .nullable()
    .typeError(t('The value must be a datetime (yyyy-MM-dd hh:mm (a|p)m)')),
  last_seen: Yup.date()
    .nullable()
    .typeError(t('The value must be a datetime (yyyy-MM-dd hh:mm (a|p)m)')),
  sophistication: Yup.object().nullable(),
  resource_level: Yup.object().nullable(),
  roles: Yup.array().nullable(),
  primary_motivation: Yup.object().nullable(),
  secondary_motivations: Yup.array().nullable(),
  personal_motivations: Yup.array().nullable(),
  goals: Yup.string().nullable(),
  references: Yup.array(),
});

const ThreatActorEditionDetailsComponent = ({
  threatActor,
  enableReferences,
  context,
  handleClose,
}) => {
  const { t } = useFormatter();
  const handleChangeFocus = (name) => commitMutation({
    mutation: threatActorEditionDetailsFocus,
    variables: {
      id: threatActor.id,
      input: {
        focusOn: name,
      },
    },
  });
  const onSubmit = (values, { setSubmitting }) => {
    const commitMessage = values.message;
    const references = R.pluck('value', values.references || []);
    const inputValues = R.pipe(
      R.dissoc('message'),
      R.dissoc('references'),
      R.assoc(
        'first_seen',
        values.first_seen ? parse(values.first_seen).format() : null,
      ),
      R.assoc(
        'last_seen',
        values.last_seen ? parse(values.last_seen).format() : null,
      ),
      R.assoc(
        'goals',
        values.goals && values.goals.length ? R.split('\n', values.goals) : [],
      ),
      R.toPairs,
      R.map((n) => ({
        key: n[0],
        value: adaptFieldValue(n[1]),
      })),
    )(values);
    commitMutation({
      mutation: threatActorMutationFieldPatch,
      variables: {
        id: threatActor.id,
        input: inputValues,
        commitMessage:
          commitMessage && commitMessage.length > 0 ? commitMessage : null,
        references,
      },
      setSubmitting,
      onCompleted: () => {
        setSubmitting(false);
        handleClose();
      },
    });
  };
  const handleSubmitField = (name, value) => {
    if (!enableReferences) {
      let finalValue = value;
      if (name === 'goals') {
        finalValue = value && value.length > 0 ? R.split('\n', value) : [];
      }
      threatActorValidation(t)
        .validateAt(name, { [name]: value })
        .then(() => {
          commitMutation({
            mutation: threatActorMutationFieldPatch,
            variables: {
              id: threatActor.id,
              input: { key: name, value: finalValue || '' },
            },
          });
        })
        .catch(() => false);
    }
  };
  const initialValues = R.pipe(
    R.assoc('first_seen', buildDate(threatActor.first_seen)),
    R.assoc('last_seen', buildDate(threatActor.last_seen)),
    R.assoc(
      'secondary_motivations',
      threatActor.secondary_motivations ? threatActor.secondary_motivations : [],
    ),
    R.assoc(
      'personal_motivations',
      threatActor.personal_motivations ? threatActor.personal_motivations : [],
    ),
    R.assoc('goals', R.join('\n', threatActor.goals ? threatActor.goals : [])),
    R.assoc('roles', threatActor.roles ? threatActor.roles : []),
    R.pick([
      'first_seen',
      'last_seen',
      'sophistication',
      'resource_level',
      'primary_motivation',
      'secondary_motivations',
      'personal_motivations',
      'goals',
      'roles',
    ]),
  )(threatActor);
  return (
    <div>
      <Formik
        enableReinitialize={true}
        initialValues={initialValues}
        validationSchema={threatActorValidation(t)}
        onSubmit={onSubmit}
      >
        {({
          submitForm,
          isSubmitting,
          setFieldValue,
          values,
          isValid,
          dirty,
        }) => (
          <div>
            <Form style={{ margin: '20px 0 20px 0' }}>
              <Field
                component={DateTimePickerField}
                name="first_seen"
                onFocus={handleChangeFocus}
                onSubmit={handleSubmitField}
                TextFieldProps={{
                  label: t('First seen'),
                  variant: 'standard',
                  fullWidth: true,
                  helperText: (
                    <SubscriptionFocus
                      context={context}
                      fieldName="first_seen"
                    />
                  ),
                }}
              />
              <Field
                component={DateTimePickerField}
                name="last_seen"
                onFocus={handleChangeFocus}
                onSubmit={handleSubmitField}
                TextFieldProps={{
                  label: t('Last seen'),
                  variant: 'standard',
                  fullWidth: true,
                  style: { marginTop: 20 },
                  helperText: (
                    <SubscriptionFocus
                      context={context}
                      fieldName="last_seen"
                    />
                  ),
                }}
              />
              <OpenVocabField
                label={t('Sophistication')}
                type="threat-actor-sophistication-ov"
                name="sophistication"
                onFocus={handleChangeFocus}
                onChange={(name, value) => setFieldValue(name, value)}
                onSubmit={handleSubmitField}
                containerStyle={fieldSpacingContainerStyle}
                variant="edit"
                multiple={false}
                editContext={context}
              />
              <OpenVocabField
                label={t('Resource level')}
                type="attack-resource-level-ov"
                name="resource_level"
                onFocus={handleChangeFocus}
                onChange={(name, value) => setFieldValue(name, value)}
                onSubmit={handleSubmitField}
                containerStyle={fieldSpacingContainerStyle}
                variant="edit"
                multiple={false}
                editContext={context}
              />
              <OpenVocabField
                label={t('Roles')}
                type="threat-actor-role-ov"
                name="roles"
                onFocus={handleChangeFocus}
                onChange={(name, value) => setFieldValue(name, value)}
                onSubmit={handleSubmitField}
                containerStyle={fieldSpacingContainerStyle}
                variant="edit"
                multiple={true}
                editContext={context}
              />
              <OpenVocabField
                label={t('Primary motivation')}
                type="attack-motivation-ov"
                name="primary_motivation"
                onFocus={handleChangeFocus}
                onChange={(name, value) => setFieldValue(name, value)}
                onSubmit={handleSubmitField}
                containerStyle={fieldSpacingContainerStyle}
                variant="edit"
                multiple={false}
                editContext={context}
              />
              <OpenVocabField
                label={t('Secondary motivations')}
                type="attack-motivation-ov"
                name="secondary_motivations"
                onFocus={handleChangeFocus}
                onChange={(name, value) => setFieldValue(name, value)}
                onSubmit={handleSubmitField}
                containerStyle={fieldSpacingContainerStyle}
                variant="edit"
                multiple={true}
                editContext={context}
              />
              <OpenVocabField
                label={t('Personal motivations')}
                type="attack-motivation-ov"
                name="personal_motivations"
                onFocus={handleChangeFocus}
                onChange={(name, value) => setFieldValue(name, value)}
                onSubmit={handleSubmitField}
                containerStyle={fieldSpacingContainerStyle}
                variant="edit"
                multiple={true}
                editContext={context}
              />
              <Field
                component={TextField}
                variant="standard"
                name="goals"
                label={t('Goals (1 / line)')}
                fullWidth={true}
                multiline={true}
                rows="4"
                style={{ marginTop: 20 }}
                onFocus={handleChangeFocus}
                onSubmit={handleSubmitField}
                helperText={
                  <SubscriptionFocus context={context} fieldName="goals" />
                }
              />
              {enableReferences && (
                <CommitMessage
                  submitForm={submitForm}
                  disabled={isSubmitting || !isValid || !dirty}
                  setFieldValue={setFieldValue}
                  open={false}
                  values={values.references}
                  id={threatActor.id}
                />
              )}
            </Form>
          </div>
        )}
      </Formik>
    </div>
  );
};

export default createFragmentContainer(ThreatActorEditionDetailsComponent, {
  threatActor: graphql`
    fragment ThreatActorEditionDetails_threatActor on ThreatActor {
      id
      first_seen
      last_seen
      sophistication
      resource_level
      primary_motivation
      secondary_motivations
      personal_motivations
      goals
      roles
    }
  `,
});
