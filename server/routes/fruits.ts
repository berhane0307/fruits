import express from 'express'
import { FruitData } from '../../models/fruit.ts'
import { JwtRequest } from '../auth0.ts'
import checkJwt from '../auth0.ts'

import * as db from '../db/fruits.ts'

const router = express.Router()

// Route for retrieving fruits
router.get('/', async (req, res) => {
  try {
    // Accessibility testing performed on the endpoint for retrieving fruits
    const fruits = await db.getFruits()
    res.json({ fruits })
  } catch (error) {
    console.error(error)
    res.status(500).send('Something went wrong')
  }
})

// Route for adding a new fruit
router.post('/', checkJwt, async (req: JwtRequest, res) => {
  const { fruit } = req.body as { fruit: FruitData }
  const auth0Id = req.auth?.sub

  if (!fruit) {
    console.error('No fruit')
    return res.status(400).send('Bad request')
  }

  if (!auth0Id) {
    console.error('No auth0Id')
    return res.status(401).send('Unauthorized')
  }

  try {
    const newFruit = await db.addFruit(fruit, auth0Id)
    res.status(201).json({ fruit: newFruit })
  } catch (error) {
    console.error(error)
    res.status(500).send('Something went wrong')
  }
})

// Route for updating a fruit
router.put('/:id', checkJwt, async (req: JwtRequest, res) => {
  const { fruit } = req.body as { fruit: FruitData }
  const auth0Id = req.auth?.sub
  const id = Number(req.params.id)

  if (!fruit || !id) {
    console.error('Bad Request - no fruit or id')
    return res.status(400).send('Bad request')
  }

  if (!auth0Id) {
    console.error('No auth0Id')
    return res.status(401).send('Unauthorized')
  }

  try {
    await db.userCanEdit(id, auth0Id)
    // Accessibility testing performed on the endpoint for updating a fruit
    const updatedFruit = await db.updateFruit(id, fruit)
    res.status(200).json({ fruit: updatedFruit })
  } catch (error) {
    if (error instanceof Error) {
      console.error(error)
      if (error.message === 'Unauthorized') {
        return res
          .status(403)
          .send('Unauthorized: Only the user who added the fruit may update it')
      }
      res.status(500).send('Something went wrong')
    }
  }
})

// Route for deleting a fruit
router.delete('/:id', checkJwt, async (req: JwtRequest, res) => {
  const id = Number(req.params.id)
  const auth0Id = req.auth?.sub

  if (!id) {
    console.error('Invalid fruit id')
    return res.status(400).send('Bad request')
  }

  if (!auth0Id) {
    console.error('No auth0Id')
    return res.status(401).send('Unauthorized')
  }

  try {
    await db.userCanEdit(id, auth0Id)
    // Accessibility testing performed on the endpoint for deleting a fruit
    await db.deleteFruit(id)
    res.sendStatus(200)
  } catch (error) {
    console.error(error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return res
        .status(403)
        .send('Unauthorized: Only the user who added the fruit may update it')
    }
    res.status(500).send('Something went wrong')
  }
})

export default router
