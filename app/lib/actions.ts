'use server';

import {z} from 'zod'
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const formSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
})

const CreateInvoice = formSchema.omit({id: true, date: true})

export async function createInvoice(formData: FormData) {

    const {customerId, amount, status} = CreateInvoice.parse(Object.fromEntries(formData))

    const ammounCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${ammounCents}, ${status}, ${date})
    `

    const path = '/dashboard/invoices';
    revalidatePath(path);
    redirect(path);
}