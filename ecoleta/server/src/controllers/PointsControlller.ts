import {Request, Response} from 'express';
import knex from '../database/connection';

class PointsController {

    async index(request: Request, response: Response) {
        // cidade, uf, items
        const { city, uf, items} = request.query;

        const parsedItems = String(items).split(',').map(item => Number(item.trim()));

        /**
         * SELECT DISTINCT * FROM points
         *   JOIN point_items ON points.id = point_items.point_id
         *   WHERE point_items.item_id IN parsedItems
         *     AND city = city
         *     AND uf = uf
         */

        const points = await knex('points')
            .join('point_items', 'points.id', '=', 'point_items.point_id')
            .whereIn('point_items.item_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('points.*');        // exibe apenas os dados da tabela 'points' e não vem dados da tabela 'point_items' 

        response.json(points);
    }

    async show(request: Request, response: Response) {
        const {id} = request.params;        // igual a: "const id = request.params.id" (desestruturação)

        const point = await knex('points').where('id', id).first();   // busca o primeiro registro (utilizado para buscar retorno único)

        if (!point) {
            return response.status(400).json({ message: 'Point not found' });
        }

        /**
         * SELECT * FROM items
         *   JOIN point_items ON items.id = point_items.item_id
         *   WHERE point_items.point_id = {id}
         */
        const items = await knex('items')
            .join('point_items', 'items.id', '=', 'point_items.item_id')
            .where('point_items.point_id', id)
            .select('items.title');     // retorna apenas o title do item


        return response.json({ point, items});
    }

    async create(request: Request, response: Response) {
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        } = request.body;
    
        const point = {
            image: 'https://images.unsplash.com/photo-1569095723914-2f8d7d3de475?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60',
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        }
    
        const trx = await knex.transaction();
    
        const insertedIds = await trx('points').insert(point);
    
        const point_id = insertedIds[0];    // só retorna 1 id porque só insere 1 objeto
    
        const pointItems = items.map((item_id: number) => {
            return {
                item_id,
                point_id
            };
        })
    
        await trx('point_items').insert(pointItems);

        trx.commit(); 
    
        return response.json({
            id: point_id,
            ...point,
        });
    
    }
}

export default PointsController;