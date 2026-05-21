import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // No cache for real-time stock

export async function GET(req) {
    try {
        // Fetch all game types using Admin SDK (always fresh from server)
        const typesSnapshot = await adminDb.collection('game_types').orderBy('createdAt', 'desc').get();

        const products = [];

        // For each type, count available codes
        for (const typeDoc of typesSnapshot.docs) {
            const typeData = typeDoc.data();
            const typeId = typeDoc.id;

            // Count codes that are NOT used (Admin SDK - always real-time)
            const codesSnapshot = await adminDb.collection('redeem_codes')
                .where('typeId', '==', typeId)
                .where('isUsed', '==', false)
                .get();

            products.push({
                id: typeId,
                name: typeData.name,
                price: typeData.sellingPrice,
                capitalPrice: typeData.capitalPrice,
                stock: codesSnapshot.size, // Available codes count
                createdAt: typeData.createdAt,
            });
        }

        return Response.json({
            success: true,
            data: products,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
