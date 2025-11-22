import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import Loading from '@/components/ui/Loading'
import readingListService from '@/services/api/readingListService'
import userService from '@/services/api/userService'

export default function AddToListModal({ isOpen, onClose, storyId, storyTitle }) {
  const [readingLists, setReadingLists] = useState([])
  const [selectedLists, setSelectedLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newListName, setNewListName] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadUserLists()
    }
  }, [isOpen])

  const loadUserLists = async () => {
    try {
      setLoading(true)
      const currentUser = await userService.getCurrentUser()
      const lists = await readingListService.getListsByUserId(currentUser.Id)
      setReadingLists(lists)
      
      // Check which lists already contain this story
      const listsContainingStory = await readingListService.getListsContainingStory(storyId, currentUser.Id)
      setSelectedLists(listsContainingStory.map(list => list.Id))
    } catch (err) {
      toast.error('Failed to load reading lists')
    } finally {
      setLoading(false)
    }
  }

  const handleListToggle = (listId) => {
    setSelectedLists(prev => 
      prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const currentUser = await userService.getCurrentUser()
      const originalLists = await readingListService.getListsContainingStory(storyId, currentUser.Id)
      const originalListIds = originalLists.map(list => list.Id)

      // Add to new lists
      const listsToAdd = selectedLists.filter(id => !originalListIds.includes(id))
      for (const listId of listsToAdd) {
        await readingListService.addStoryToList(listId, storyId)
      }

      // Remove from unselected lists
      const listsToRemove = originalListIds.filter(id => !selectedLists.includes(id))
      for (const listId of listsToRemove) {
        await readingListService.removeStoryFromList(listId, storyId)
      }

      toast.success('Reading lists updated successfully')
      onClose()
    } catch (err) {
      toast.error('Failed to update reading lists')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateList = async (e) => {
    e.preventDefault()
    if (!newListName.trim()) {
      toast.error('List name is required')
      return
    }

    try {
      const currentUser = await userService.getCurrentUser()
      const newList = await readingListService.createList({
        name: newListName.trim(),
        description: '',
        userId: currentUser.Id
      })
      
      setReadingLists(prev => [...prev, newList])
      setSelectedLists(prev => [...prev, newList.Id])
      setShowCreateForm(false)
      setNewListName('')
      toast.success('Reading list created successfully')
    } catch (err) {
      toast.error('Failed to create reading list')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-96 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Add to Reading List</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <ApperIcon name="X" className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600">{storyTitle}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : (
            <div className="space-y-3">
              {readingLists.map((list) => (
                <label
                  key={list.Id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedLists.includes(list.Id)}
                    onChange={() => handleListToggle(list.Id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{list.name}</div>
                    <div className="text-sm text-gray-500">{list.storyIds.length} stories</div>
                  </div>
                </label>
              ))}

              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-gray-600 hover:text-gray-700"
                >
                  <ApperIcon name="Plus" className="h-4 w-4" />
                  <span>Create New List</span>
                </button>
              ) : (
                <form onSubmit={handleCreateList} className="space-y-3">
                  <Input
                    label="New List Name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Enter list name"
                    required
                  />
                  <div className="flex space-x-2">
                    <Button type="submit" size="sm" className="flex-1">Create</Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowCreateForm(false)
                        setNewListName('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center space-x-2"
            >
              {saving && <ApperIcon name="Loader2" className="h-4 w-4 animate-spin" />}
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}