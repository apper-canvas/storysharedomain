import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import Loading from '@/components/ui/Loading'
import ErrorView from '@/components/ui/ErrorView'
import Empty from '@/components/ui/Empty'
import StoryGrid from '@/components/organisms/StoryGrid'
import readingListService from '@/services/api/readingListService'
import userService from '@/services/api/userService'

export default function ReadingLists() {
  const navigate = useNavigate()
  const [readingLists, setReadingLists] = useState([])
  const [selectedList, setSelectedList] = useState(null)
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [storiesLoading, setStoriesLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => {
    loadReadingLists()
  }, [])

  const loadReadingLists = async () => {
    try {
      setLoading(true)
      const currentUser = await userService.getCurrentUser()
      const lists = await readingListService.getListsByUserId(currentUser.Id)
      setReadingLists(lists)
      
      if (lists.length > 0 && !selectedList) {
        setSelectedList(lists[0])
        loadStoriesForList(lists[0].Id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadStoriesForList = async (listId) => {
    try {
      setStoriesLoading(true)
      const listStories = await readingListService.getStoriesInList(listId)
      setStories(listStories)
    } catch (err) {
      toast.error('Failed to load stories')
    } finally {
      setStoriesLoading(false)
    }
  }

  const handleListSelect = (list) => {
    setSelectedList(list)
    loadStoriesForList(list.Id)
  }

  const handleCreateList = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('List name is required')
      return
    }

    try {
      const currentUser = await userService.getCurrentUser()
      const newList = await readingListService.createList({
        ...formData,
        userId: currentUser.Id
      })
      
      setReadingLists(prev => [...prev, newList])
      setShowCreateForm(false)
      setFormData({ name: '', description: '' })
      toast.success('Reading list created successfully')
    } catch (err) {
      toast.error('Failed to create reading list')
    }
  }

  const handleEditList = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('List name is required')
      return
    }

    try {
      const updatedList = await readingListService.updateList(selectedList.Id, formData)
      setReadingLists(prev => prev.map(list => 
        list.Id === selectedList.Id ? updatedList : list
      ))
      setSelectedList(updatedList)
      setShowEditForm(false)
      setFormData({ name: '', description: '' })
      toast.success('Reading list updated successfully')
    } catch (err) {
      toast.error('Failed to update reading list')
    }
  }

  const handleDeleteList = async (listId) => {
    const list = readingLists.find(l => l.Id === listId)
    if (list?.isDefault) {
      toast.error('Cannot delete default reading lists')
      return
    }

    if (!confirm('Are you sure you want to delete this reading list?')) {
      return
    }

    try {
      await readingListService.deleteList(listId)
      const updatedLists = readingLists.filter(l => l.Id !== listId)
      setReadingLists(updatedLists)
      
      if (selectedList?.Id === listId) {
        const newSelectedList = updatedLists[0] || null
        setSelectedList(newSelectedList)
        if (newSelectedList) {
          loadStoriesForList(newSelectedList.Id)
        } else {
          setStories([])
        }
      }
      
      toast.success('Reading list deleted successfully')
    } catch (err) {
      toast.error('Failed to delete reading list')
    }
  }

  const startEdit = (list) => {
    setFormData({ name: list.name, description: list.description })
    setShowEditForm(true)
  }

  if (loading) return <Loading />
  if (error) return <ErrorView message={error} />

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Reading Lists</h1>
            <p className="mt-2 text-gray-600">Organize your stories into custom collections</p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2"
          >
            <ApperIcon name="Plus" className="h-4 w-4" />
            <span>Create List</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Reading Lists Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">My Lists</h2>
              </div>
              <div className="p-2">
                {readingLists.map((list) => (
                  <button
                    key={list.Id}
                    onClick={() => handleListSelect(list)}
                    className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                      selectedList?.Id === list.Id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{list.name}</div>
                        <div className="text-sm text-gray-500">
                          {list.storyIds.length} stories
                        </div>
                      </div>
                      {!list.isDefault && (
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              startEdit(list)
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <ApperIcon name="Edit3" className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteList(list.Id)
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <ApperIcon name="Trash2" className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stories Content */}
          <div className="lg:col-span-3">
            {selectedList ? (
              <div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedList.name}</h2>
                      {selectedList.description && (
                        <p className="mt-1 text-gray-600">{selectedList.description}</p>
                      )}
                    </div>
                    {!selectedList.isDefault && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          onClick={() => startEdit(selectedList)}
                          className="flex items-center space-x-1"
                        >
                          <ApperIcon name="Edit3" className="h-4 w-4" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleDeleteList(selectedList.Id)}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                        >
                          <ApperIcon name="Trash2" className="h-4 w-4" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {storiesLoading ? (
                  <Loading />
                ) : stories.length > 0 ? (
                  <StoryGrid 
                    stories={stories}
                    loading={false}
                    emptyState={{
                      type: 'reading',
                      title: 'No stories in this list',
                      description: 'Add stories to this list from story pages',
                      actionText: 'Browse Stories',
                      onAction: () => navigate('/')
                    }}
                  />
                ) : (
                  <Empty
                    type="reading"
                    title="No stories in this list"
                    description="Add stories to this list by visiting story pages and clicking 'Add to List'"
                    actionText="Browse Stories"
                    onAction={() => navigate('/')}
                  />
                )}
              </div>
            ) : (
              <Empty
                type="reading"
                title="No reading lists"
                description="Create your first reading list to organize your stories"
                actionText="Create List"
                onAction={() => setShowCreateForm(true)}
              />
            )}
          </div>
        </div>

        {/* Create List Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Create Reading List</h2>
                  <button
                    onClick={() => {
                      setShowCreateForm(false)
                      setFormData({ name: '', description: '' })
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ApperIcon name="X" className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateList} className="space-y-4">
                  <Input
                    label="List Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter list name"
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your reading list"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowCreateForm(false)
                        setFormData({ name: '', description: '' })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create List</Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit List Modal */}
        {showEditForm && selectedList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Edit Reading List</h2>
                  <button
                    onClick={() => {
                      setShowEditForm(false)
                      setFormData({ name: '', description: '' })
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ApperIcon name="X" className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleEditList} className="space-y-4">
                  <Input
                    label="List Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter list name"
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your reading list"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowEditForm(false)
                        setFormData({ name: '', description: '' })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Update List</Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}