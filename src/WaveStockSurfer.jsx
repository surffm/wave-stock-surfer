<div className="flex border-b border-white/20 overflow-x-auto">
                <button
                  onClick={() => activeMenuTab === 'trending' ? setShowMenu(false) : setActiveMenuTab('trending')}
                  className={`flex-1 px-6 py-4 font-bold transition-all whitespace-nowrap ${
                    activeMenuTab === 'trending' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-blue-300 hover:bg-white/5'
                  }`}
                >
                  🔥 Trending
                </button>
                <button
                  onClick={() => activeMenuTab === 'yourlist' ? setShowMenu(false) : setActiveMenuTab('yourlist')}
                  className={`flex-1 px-6 py-4 font-bold transition-all whitespace-nowrap ${
                    activeMenuTab === 'yourlist' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-blue-300 hover:bg-white/5'
                  }`}
                >
                  📋 Your List
                </button>
                <button
                  onClick={() => activeMenuTab === 'add' ? setShowMenu(false) : setActiveMenuTab('add')}
                  className={`flex-1 px-6 py-4 font-bold transition-all whitespace-nowrap ${
                    activeMenuTab === 'add' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-blue-300 hover:bg-white/5'
                  }`}
                >
                  ➕ Add Waves
                </button>
                <button
                  onClick={() => activeMenuTab === 'faq' ? setShowMenu(false) : setActiveMenuTab('faq')}
                  className={`flex-1 px-6 py-4 font-bold transition-all whitespace-nowrap ${
                    activeMenuTab === 'faq' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-blue-300 hover:bg-white/5'
                  }`}
                >
                  ❓ FAQ
                </button>
                <button
                  onClick={() => activeMenuTab === 'mission' ? setShowMenu(false) : setActiveMenuTab('mission')}
                  className={`flex-1 px-6 py-4 font-bold transition-all whitespace-nowrap ${
                    activeMenuTab === 'mission' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-blue-300 hover:bg-white/5'
                  }`}
                >
                  🌊 Mission
                </button>
              </div>