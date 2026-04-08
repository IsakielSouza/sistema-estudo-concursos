import * as yup from 'yup'

export const cycleSchema = yup.object({
  name: yup.string().required('Informe o nome do ciclo'),
  plannedHours: yup
    .number()
    .required('Informe as horas disponíveis')
    .min(1, 'Mínimo de 1 hora')
    .max(168, 'Máximo de 168 horas (semana inteira)'),
  selectedSubjectIds: yup
    .array(yup.string().required())
    .min(1, 'Selecione pelo menos uma matéria')
    .required(),
})

export type CycleFormData = yup.InferType<typeof cycleSchema>
