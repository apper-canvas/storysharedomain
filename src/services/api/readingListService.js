import readingListsData from "@/services/mockData/readingLists.json"

let nextId = Math.max(...readingListsData.map(list => list.Id), 0) + 1

function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

class ReadingListService {
  constructor() {
    this.readingLists = [...readingListsData]
  }

  async getAllLists() {
    await delay()
    return this.readingLists.map(list => ({ ...list }))
  }

  async getListsByUserId(userId) {
    await delay()
    return this.readingLists
      .filter(list => list.userId === parseInt(userId))
      .map(list => ({ ...list }))
  }

  async getListById(id) {
    await delay()
    const list = this.readingLists.find(list => list.Id === parseInt(id))
    if (!list) {
      throw new Error('Reading list not found')
    }
    return { ...list }
  }

  async createList(listData) {
    await delay()
    const newList = {
      Id: nextId++,
      name: listData.name,
      description: listData.description || '',
      userId: listData.userId,
      storyIds: [],
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    this.readingLists.push(newList)
    return { ...newList }
  }

  async updateList(id, updateData) {
    await delay()
    const listIndex = this.readingLists.findIndex(list => list.Id === parseInt(id))
    if (listIndex === -1) {
      throw new Error('Reading list not found')
    }

    const updatedList = {
      ...this.readingLists[listIndex],
      ...updateData,
      Id: parseInt(id),
      updatedAt: new Date().toISOString()
    }

    this.readingLists[listIndex] = updatedList
    return { ...updatedList }
  }

  async deleteList(id) {
    await delay()
    const listIndex = this.readingLists.findIndex(list => list.Id === parseInt(id))
    if (listIndex === -1) {
      throw new Error('Reading list not found')
    }

    // Don't allow deletion of default lists
    if (this.readingLists[listIndex].isDefault) {
      throw new Error('Cannot delete default reading list')
    }

    this.readingLists.splice(listIndex, 1)
    return true
  }

  async addStoryToList(listId, storyId) {
    await delay()
    const list = this.readingLists.find(list => list.Id === parseInt(listId))
    if (!list) {
      throw new Error('Reading list not found')
    }

    const storyIdInt = parseInt(storyId)
    if (!list.storyIds.includes(storyIdInt)) {
      list.storyIds.push(storyIdInt)
      list.updatedAt = new Date().toISOString()
    }

    return { ...list }
  }

  async removeStoryFromList(listId, storyId) {
    await delay()
    const list = this.readingLists.find(list => list.Id === parseInt(listId))
    if (!list) {
      throw new Error('Reading list not found')
    }

    const storyIdInt = parseInt(storyId)
    const storyIndex = list.storyIds.indexOf(storyIdInt)
    if (storyIndex > -1) {
      list.storyIds.splice(storyIndex, 1)
      list.updatedAt = new Date().toISOString()
    }

    return { ...list }
  }

  async getStoriesInList(listId) {
    await delay()
    const list = this.readingLists.find(list => list.Id === parseInt(listId))
    if (!list) {
      throw new Error('Reading list not found')
    }

    // Import story service to get story details
    const { default: storyService } = await import('./storyService.js')
    const allStories = await storyService.getStories()
    
    return allStories.filter(story => list.storyIds.includes(story.Id))
  }

  async getListsContainingStory(storyId, userId) {
    await delay()
    const userLists = await this.getListsByUserId(userId)
    return userLists.filter(list => list.storyIds.includes(parseInt(storyId)))
  }

  async isStoryInList(listId, storyId) {
    await delay()
    const list = this.readingLists.find(list => list.Id === parseInt(listId))
    if (!list) return false
    return list.storyIds.includes(parseInt(storyId))
  }
}

export default new ReadingListService()