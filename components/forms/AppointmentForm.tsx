"use client"
import React from "react"
 
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { createUser } from "../../lib/actions/patient.actions";
import { Form } from "../../components/ui/form"
import CustomFormField from "../../components/ui/CustomFormField"
import SubmitButton from "../../components/SubmitButton"
import { useState } from "react"
import { CreateAppointmentSchema, getAppointmentSchema } from "../../lib/validation"
import { useRouter } from "next/navigation"
import { FormFieldType } from "./PatientForm"
import Image from "next/image"
import { SelectItem } from "../ui/select"
import { Doctors } from "../../constants"
import { createAppointment, updateAppointment } from "../../lib/actions/appointment.actions"
import { Appointment } from "../../types/appwrite.types"
 
export const AppintmentForm = ({
    userId, 
    patientId, 
    type,
    appointment,
    setOpen
}: {
    userId: string;
    patientId: string;
    type: "create" | "cancel" | "schedule";
    appointment?: Appointment;
    setOpen: (open:boolean) => void

}) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

  const AppointmentFormValidation = getAppointmentSchema(type)

  const form = useForm<z.infer<typeof AppointmentFormValidation>>({
    resolver: zodResolver(AppointmentFormValidation),
    defaultValues: {
      primaryPhysician: appointment ? appointment.primaryPhysician : '',
      schedule: appointment ? new Date(appointment?.schedule) : new Date(Date.now()),
      reason: appointment?.reason || '',
      note: appointment?.note || '',
      cancellationReason: appointment?.cancellationReason || '',
    },
  })
 
  async function onSubmit(values: z.infer<typeof AppointmentFormValidation>) {
    setIsLoading(true);

    let status;
    switch (type){
        case 'schedule':
            status = 'scheduled';
            break;
        case 'cancel':
            status = 'cancelled';
            break;
        default:
            status = 'pending';
            break;
    }

    console.log('BEFORE THE TRY', type)

    try {
        if(type === 'create' && patientId) {
            console.log('IM HERE')
            const appointmentData = {
                userId,
                patient: patientId,
                primaryPhysician: values.primaryPhysician,
                schedule: new Date(values.schedule),
                reason: values.reason!,
                note: values.note,
                status: status as Status,
            }

            const appointment = await createAppointment(appointmentData);

            console.log(appointment)

            if(appointment) {
                form.reset();
                router.push(`/patients/${userId}/new-appointment/success?appointmentId=${appointment.$id}`)
            }
        } else {
            const appointmentToUpdate = {
                userId,
                appointmentId:appointment?.$id!,
                appointment: {
                    primaryPhysician: values?.primaryPhysician,
                    schedule: new Date(values?.schedule),
                    status: status as Status,
                    cancellationReason: values?.cancellationReason,
                },
                type
            }

            const updatetedAppointment = await updateAppointment(appointmentToUpdate);

            if(updatetedAppointment) {
                setOpen && setOpen(false);
                form.reset();
            }
        }
    } catch (error) {
        console.log(error);
    }
  }

  let buttonLabel;

  switch (type) {
    case 'cancel':
        buttonLabel = 'Cancel Appointment';
        break;
    case 'create':
        buttonLabel = 'Create Appointment'
        break;
    case 'schedule':
        buttonLabel = 'Schedule Appointment'
        break;
    default:
        break;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1">
        {type === 'create' && <section className="mb-12 space-y-4">
            <h1 className="header">New Appointment</h1>
            <p className="text-dark-700">Request a new appointment in 10 seconds</p>
        </section>}

        {type !== "cancel" && (
            <>
                <CustomFormField
                    fieldType={FormFieldType.SELECT}
                    control={form.control}
                    name="primaryPhysician"
                    label="Doctor"
                    placeholder="Select a Doctor"
                > 
                    {Doctors.map((doctor) => (
                    <SelectItem key={doctor.name} value={doctor.name}>
                        <div className="flex cursor-pointer items-center gap-2">
                        <Image
                            src={doctor.image}
                            width={32}
                            height={32}
                            alt={doctor.name}
                            className="rounded-full border border-dark-500"
                        />
                        <p>{doctor.name}</p>
                        </div>
                    </SelectItem>
                    ))}
                </CustomFormField>

                <CustomFormField
                    fieldType={FormFieldType.DATE_PICKER}
                    control={form.control}
                    name="schedule"
                    label="Expected Appointment Date"
                    showTimeSelect
                    dateFormat="MM/dd/yyyy - h:mm aa"
                />

                <div className="flex flex-col gap-6 xl:flex-row">
                    <CustomFormField
                        fieldType={FormFieldType.TEXTAREA}
                        control={form.control}
                        name="reason"
                        label="Reason for appointment"
                        placeholder="Enter reason for appointment"
                    />
                    <CustomFormField
                        fieldType={FormFieldType.TEXTAREA}
                        control={form.control}
                        name="note"
                        label="Notes"
                        placeholder="Enter notes"
                    />
                </div>
            </>
        )}

        {type === "cancel" && (
            <CustomFormField
                fieldType={FormFieldType.TEXTAREA}
                control={form.control}
                name="cancellationReason"
                label="Reason for Cancellation"
                placeholder="Enter reason for cancellation"
            />
        )}
         
        <SubmitButton isLoading={isLoading } className={`${type === 'cancel' ? 'shad-danger-btn' : 'shad-primary-btn'} w-full`}>{buttonLabel}</SubmitButton>
      </form>
    </Form>
  )
}

export default AppintmentForm