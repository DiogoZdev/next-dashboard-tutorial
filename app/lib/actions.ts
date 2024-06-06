'use server';

import { z } from 'zod'
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
  try {
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
  catch {
    return {
      message: 'Database error: Failed to create invoice',
    }
  }

}


const UpdateInvoice = formSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
    
    const amountInCents = amount * 100;
    
    try {
      await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
     
      revalidatePath('/dashboard/invoices');
      redirect('/dashboard/invoices');
    } catch {
      return {
        message: 'Database error: Failed to update invoice',
      }
    }
  }

  export async function deleteInvoice(id: string) {

    // throw new Error('Failed to do something');

    try {
      await sql`DELETE FROM invoices WHERE id = ${id}`;
      revalidatePath('/dashboard/invoices');
      return {
        message: 'Invoice deleted successfully',
      }
    }
    catch {
      return {
        message: 'Database error:Failed to delete invoice',
      }
    }
  }